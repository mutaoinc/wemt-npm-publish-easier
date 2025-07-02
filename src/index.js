#!/usr/bin/env node

import { execSync } from "child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { cp } from "fs/promises";

// 根目录路径
const ROOT_PATH = resolve(process.cwd());

// 创建初始配置文件
function createInitialConfig() {
    const configContent = `export default {
    // 构建命令
    buildCommand: "rollup -c",

    // 发布目录，空字符串表示当前目录
    publishDir: "publish",

    // 复制文件配置
    copyConfig: [
        // {
        //     type: "file",
        //     source: "LICENSE",
        //     target: "LICENSE",
        //     description: "LICENSE"
        // },
        // {
        //     type: "file", 
        //     source: "README.md",
        //     target: "README.md",
        //     description: "README.md"
        // },
        // {
        //     type: "dir",
        //     source: "docs",
        //     target: "docs",
        //     description: "docs directory"
        // }
    ],

    // 过滤配置 - 这些字段会从发布的 package.json 中移除
    filteredConfig: {
        // 要过滤的 scripts
        scripts: [
            // "test",
            // "dev"
        ],

        // 要过滤的 devDependencies
        devDependencies: [
            // "@types/jest",
            // "jest",
            // "typescript"
        ]
    }
};`;

    const configPath = join(ROOT_PATH, "publish.config.js");

    if (existsSync(configPath)) {
        console.log("⚠️  配置文件已存在：publish.config.js");
        console.log("如需重新初始化，请先删除现有配置文件。");
        return false;
    }

    try {
        writeFileSync(configPath, configContent);
        console.log("✅ 初始化配置文件已创建：publish.config.js");
        console.log("📝 请根据项目需要修改配置文件后再次运行工具。");
        return true;
    } catch (error) {
        console.error("❌ 创建配置文件失败：", error.message);
        return false;
    }
}

// 加载用户配置
async function loadUserConfig() {
    const configPaths = [
        join(ROOT_PATH, "publish.config.js")
    ];

    for (const configPath of configPaths) {
        if (existsSync(configPath)) {
            try {
                console.log(`📋 Loading config from ${configPath.replace(ROOT_PATH, '.')}`);
                if (configPath.endsWith('.json')) {
                    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
                    return config;
                } else {
                    const config = await import(`file://${configPath}`);
                    return config.default || config;
                }
            } catch (error) {
                console.warn(`⚠️  Warning: Failed to load config from ${configPath}:`, error.message);
            }
        }
    }

    // 没有找到任何配置文件
    return {};
}

// 清理发布目录
function cleanPublishDirectory(publishPath, publishDir) {
    if (!publishDir) {
        console.log("⚠️  Warning: 无法清理当前目录，请指定发布目录");
        return false;
    }

    if (!existsSync(publishPath)) {
        console.log("📂 发布目录不存在，无需清理");
        return true;
    }

    try {
        console.log(`🧹 正在清理发布目录: ${publishDir}`);
        rmSync(publishPath, { recursive: true, force: true });
        console.log("✅ 发布目录清理完成");
        return true;
    } catch (error) {
        console.error("❌ 清理发布目录失败：", error.message);
        return false;
    }
}

// 删除.tgz文件（跨平台兼容）
function cleanTgzFiles(publishPath) {
    try {
        const files = readdirSync(publishPath);
        const tgzFiles = files.filter(file => file.endsWith('.tgz'));
        
        if (tgzFiles.length === 0) {
            return;
        }

        console.log(`🧹 正在清理临时文件...`);
        for (const file of tgzFiles) {
            try {
                rmSync(join(publishPath, file));
                console.log(`   已删除: ${file}`);
            } catch (error) {
                console.warn(`⚠️  Warning: 无法删除文件 ${file}:`, error.message);
            }
        }
        console.log("✅ 临时文件清理完成");
    } catch (error) {
        console.warn("⚠️  Warning: 清理临时文件时出错:", error.message);
    }
}

// 解析命令行参数
function parseArgs() {
    const args = {
        autoPublish: false,      // -y 或 --yes
        incrementVersion: null,  // --increment-version 或 --no-increment-version
        buildCommand: null,      // --build-command
        help: false,            // --help
        init: false,            // --init
        clean: false,           // --clean
    };

    for (let i = 2; i < process.argv.length; i++) {
        const arg = process.argv[i];
        switch (arg) {
            case '-y':
            case '--yes':
                args.autoPublish = true;
                break;
            case '--increment-version':
                args.incrementVersion = true;
                break;
            case '--no-increment-version':
                args.incrementVersion = false;
                break;
            case '--build-command':
                if (i + 1 < process.argv.length) {
                    args.buildCommand = process.argv[++i];
                }
                break;
            case '-h':
            case '--help':
                args.help = true;
                break;
            case '--init':
                args.init = true;
                break;
            case '--clean':
                args.clean = true;
                break;
        }
    }

    return args;
}

// 显示帮助信息
function showHelp() {
    console.log(`
📦 NPM 发布助手 (npm-publish-easier)

使用方法:
  npm-publish-easier [选项]

选项:
  --init                      创建初始配置文件 (publish.config.js)
  --clean                     清理发布目录
  -y, --yes                   自动发布到 npm（包含版本递增）
  --increment-version         强制递增版本号（不发布）
  --no-increment-version      不递增版本号
  --build-command <command>   自定义构建命令
  -h, --help                  显示帮助信息

示例:
  npm-publish-easier --init                 # 创建初始配置文件
  npm-publish-easier --clean                # 清理发布目录
  npm-publish-easier                        # 准备发布文件
  npm-publish-easier -y                     # 自动发布
  npm-publish-easier --increment-version    # 仅递增版本号
  npm-publish-easier --build-command "npm run build"  # 自定义构建命令

配置文件:
  支持配置文件：publish.config.js
  
  首次使用请运行: npm-publish-easier --init
`);
}

// 增加版本号
function incrementVersion(version) {
    const [major, minor, patch] = version.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
}

// 执行命令
function execCommand(command, options = {}) {
    try {
        execSync(command, { stdio: "inherit", ...options });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        throw error;
    }
}

// 复制文件或目录
async function copyFiles(copyConfig, publishPath) {
    for (const config of copyConfig) {
        console.log(`📦 Copying ${config.description}...`);
        try {
            const source = join(ROOT_PATH, config.source);
            const target = join(publishPath, config.target);

            // 检查源文件是否存在
            if (!existsSync(source)) {
                console.warn(`⚠️  Warning: Source file/directory not found: ${config.source}`);
                continue;
            }

            if (config.type === "file") {
                copyFileSync(source, target);
            } else if (config.type === "dir") {
                await cp(source, target, { recursive: true, force: true });
            }
        } catch (error) {
            console.error(`❌ Error copying ${config.description}:`, error);
            throw error;
        }
    }
}

// 更新 package.json
function updatePackageJson(packageJson, newVersion, filteredConfig, publishPath, shouldUpdateMainVersion = true) {
    if (newVersion !== packageJson.version) {
        console.log(`📝 Updating version from ${packageJson.version} to ${newVersion}`);
    }

    const { ...restPackageJson } = packageJson;
    const publishPackageJson = {
        ...restPackageJson,
        version: newVersion,
        ...Object.fromEntries(
            Object.entries(restPackageJson).map(([key, value]) => {
                if (filteredConfig[key] && typeof value === 'object' && value !== null) {
                    return [key, Object.fromEntries(Object.entries(value).filter(([k]) => !filteredConfig[key].includes(k)))];
                }
                return [key, value];
            })
        ),
    };

    // 写入发布用的 package.json
    writeFileSync(join(publishPath, "package.json"), JSON.stringify(publishPackageJson, null, 2));
    console.log("✅ Package.json for publish created");

    // 更新主项目的 package.json（仅在需要时）
    if (shouldUpdateMainVersion && newVersion !== packageJson.version) {
        packageJson.version = newVersion;
        writeFileSync(join(ROOT_PATH, "package.json"), JSON.stringify(packageJson, null, 2));
        console.log("✅ Main package.json updated");
    }
}

async function main() {
    try {
        // 解析命令行参数
        const args = parseArgs();

        // 显示帮助信息
        if (args.help) {
            showHelp();
            return;
        }

        // 处理初始化命令
        if (args.init) {
            const success = createInitialConfig();
            process.exit(success ? 0 : 1);
        }

        // 处理清理命令
        if (args.clean) {
            // 加载用户配置以获取发布目录
            const userConfig = await loadUserConfig();
            const publishDir = userConfig.publishDir !== undefined ? userConfig.publishDir : "publish";
            const publishPath = publishDir ? join(ROOT_PATH, publishDir) : ROOT_PATH;
            
            const success = cleanPublishDirectory(publishPath, publishDir);
            process.exit(success ? 0 : 1);
        }

        console.log("🚀 Starting publish process...");

        // 加载用户配置
        const userConfig = await loadUserConfig();

        // 检查是否有配置文件
        if (!userConfig || Object.keys(userConfig).length === 0) {
            console.error("❌ 未找到配置文件！");
            console.log("📝 请先运行以下命令创建配置文件：");
            console.log("   npm-publish-easier --init");
            process.exit(1);
        }

        // 获取最终配置
        const finalConfig = {
            buildCommand: args.buildCommand || userConfig.buildCommand,
            publishDir: userConfig.publishDir !== undefined ? userConfig.publishDir : "publish",
            copyConfig: userConfig.copyConfig || [],
            filteredConfig: userConfig.filteredConfig || {}
        };

        // 验证必要的配置
        if (!finalConfig.buildCommand) {
            console.error("❌ 配置错误：未指定构建命令！");
            console.log("📝 请在配置文件中设置 buildCommand，例如：");
            console.log('   buildCommand: "rollup -c"');
            process.exit(1);
        }

        // 计算发布路径
        const PUBLISH_PATH = finalConfig.publishDir ? join(ROOT_PATH, finalConfig.publishDir) : ROOT_PATH;

        console.log(`📋 使用配置：`);
        console.log(`   构建命令: ${finalConfig.buildCommand}`);
        console.log(`   发布目录: ${finalConfig.publishDir || '当前目录'}`);
        console.log(`   复制文件: ${finalConfig.copyConfig.length} 项`);
        console.log(`   过滤配置: ${Object.keys(finalConfig.filteredConfig).length} 类`);
        console.log("");

        // 清理并创建发布目录
        if (finalConfig.publishDir) {
            console.log(`🧹 Cleaning publish directory: ${finalConfig.publishDir}`);
            try {
                rmSync(PUBLISH_PATH, { recursive: true, force: true });
            } catch (error) {
                // 忽略目录不存在的错误
            }
            mkdirSync(PUBLISH_PATH, { recursive: true });
            console.log("✅ Publish directory created");
        } else {
            console.log("📂 Publishing in current directory");
        }

        // 构建项目
        console.log(`🔨 Building project with: ${finalConfig.buildCommand}`);
        execCommand(finalConfig.buildCommand);
        console.log("✅ Build completed");

        // 读取 package.json
        console.log("📄 Reading package.json...");
        const packageJson = JSON.parse(readFileSync(join(ROOT_PATH, "package.json"), "utf-8"));

        // 复制文件
        await copyFiles(finalConfig.copyConfig, PUBLISH_PATH);
        console.log("✅ Files copied successfully");

        // 确定是否需要递增版本号
        let shouldIncrementVersion = false;
        if (args.incrementVersion !== null) {
            // 明确指定了版本行为
            shouldIncrementVersion = args.incrementVersion;
        } else if (args.autoPublish) {
            // -y 参数默认递增版本
            shouldIncrementVersion = true;
        } else {
            // 默认不递增版本
            shouldIncrementVersion = false;
        }

        let newVersion = packageJson.version;
        if (shouldIncrementVersion) {
            newVersion = incrementVersion(packageJson.version);
        }

        // 更新 package.json
        updatePackageJson(packageJson, newVersion, finalConfig.filteredConfig, PUBLISH_PATH, shouldIncrementVersion);

        // 自动发布
        if (args.autoPublish) {
            // 打包
            console.log("📦 Creating npm package...");
            execCommand("npm pack", { cwd: PUBLISH_PATH });
            console.log("✅ Package created");

            // 发布
            console.log("🚀 Publishing to npm...");
            execCommand("npm publish", { cwd: PUBLISH_PATH });
            console.log("✅ Package published successfully!");

            // 删除打包的文件（使用跨平台兼容的方法）
            cleanTgzFiles(PUBLISH_PATH);
        }

        console.log("🎉 Process completed successfully!");
    } catch (error) {
        console.error("❌ Error during publish process:", error);
        process.exit(1);
    }
}

main();