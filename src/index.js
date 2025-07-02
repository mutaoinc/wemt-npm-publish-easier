#!/usr/bin/env node

import { execSync } from "child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { cp } from "fs/promises";

const ROOT_PATH = resolve(process.cwd());

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
        console.log("⚠️  Configuration file already exists: publish.config.js");
        console.log("If you need to reinitialize, please delete the existing configuration file first.");
        return false;
    }

    try {
        writeFileSync(configPath, configContent);
        console.log("✅ Initial configuration file created: publish.config.js");
        console.log("📝 Please modify the configuration file according to your project needs before running the tool again.");
        return true;
    } catch (error) {
        console.error("❌ Failed to create configuration file:", error.message);
        return false;
    }
}

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

    return {};
}

function cleanPublishDirectory(publishPath, publishDir) {
    if (!publishDir) {
        console.log("⚠️  Warning: Cannot clean current directory, please specify publish directory");
        return false;
    }

    if (!existsSync(publishPath)) {
        console.log("📂 Publish directory does not exist, no need to clean");
        return true;
    }

    try {
        console.log(`🧹 Cleaning publish directory: ${publishDir}`);
        rmSync(publishPath, { recursive: true, force: true });
        console.log("✅ Publish directory cleaned successfully");
        return true;
    } catch (error) {
        console.error("❌ Failed to clean publish directory:", error.message);
        return false;
    }
}

function cleanTgzFiles(publishPath) {
    try {
        const files = readdirSync(publishPath);
        const tgzFiles = files.filter(file => file.endsWith('.tgz'));

        if (tgzFiles.length === 0) {
            return;
        }

        console.log(`🧹 Cleaning temporary files...`);
        for (const file of tgzFiles) {
            try {
                rmSync(join(publishPath, file));
                console.log(`   Deleted: ${file}`);
            } catch (error) {
                console.warn(`⚠️  Warning: Cannot delete file ${file}:`, error.message);
            }
        }
        console.log("✅ Temporary files cleaned successfully");
    } catch (error) {
        console.warn("⚠️  Warning: Error occurred while cleaning temporary files:", error.message);
    }
}

function parseArgs() {
    const args = {
        autoPublish: false,      // -y or --yes
        incrementVersion: null,  // --increment-version or --no-increment-version
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

function showHelp() {
    console.log(`
📦 NPM 发布助手 (npm-publish-easier)

Usage:
    npm-publish-easier [options]

Options:
    --init                      创建初始配置文件 (publish.config.js)
    --clean                     清理发布目录
    -y, --yes                   自动发布到 npm（包含版本递增）
    --increment-version         强制递增版本号（不发布）
    --no-increment-version      不递增版本号
    --build-command <command>   自定义构建命令
    -h, --help                  显示帮助信息

Examples:
    npm-publish-easier --init                 # 创建初始配置文件
    npm-publish-easier --clean                # 清理发布目录
    npm-publish-easier                        # 准备发布文件
    npm-publish-easier -y                     # 自动发布
    npm-publish-easier --increment-version    # 仅递增版本号
    npm-publish-easier --build-command "npm run build"  # 自定义构建命令

Configuration file:
    首次使用请运行: npm-publish-easier --init
`);
}

function incrementVersion(version) {
    const [major, minor, patch] = version.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
}

function execCommand(command, options = {}) {
    try {
        execSync(command, { stdio: "inherit", ...options });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        throw error;
    }
}

async function copyFiles(copyConfig, publishPath) {
    for (const config of copyConfig) {
        console.log(`📦 Copying ${config.description}...`);
        try {
            const source = join(ROOT_PATH, config.source);
            const target = join(publishPath, config.target);

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

    writeFileSync(join(publishPath, "package.json"), JSON.stringify(publishPackageJson, null, 2));
    console.log("✅ Package.json for publish created");

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
            console.error("❌ No configuration file found!");
            console.log("📝 Please run the following command to create a configuration file first:");
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
            console.error("❌ Configuration error: No build command specified!");
            console.log("📝 Please set buildCommand in the configuration file, for example:");
            console.log('   buildCommand: "rollup -c"');
            process.exit(1);
        }

        // 计算发布路径
        const PUBLISH_PATH = finalConfig.publishDir ? join(ROOT_PATH, finalConfig.publishDir) : ROOT_PATH;

        console.log(`📋 Using configuration:`);
        console.log(`   Build command: ${finalConfig.buildCommand}`);
        console.log(`   Publish directory: ${finalConfig.publishDir || 'current directory'}`);
        console.log(`   Copy files: ${finalConfig.copyConfig.length} items`);
        console.log(`   Filter config: ${Object.keys(finalConfig.filteredConfig).length} types`);
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
            // 直接发布（npm publish 会自动打包，不会留下 .tgz 文件）
            console.log("🚀 Publishing to npm...");
            execCommand("npm publish", { cwd: PUBLISH_PATH });
            console.log("✅ Package published successfully!");
        }

        console.log("🎉 Process completed successfully!");
    } catch (error) {
        console.error("❌ Error during publish process:", error);
        process.exit(1);
    }
}

main();