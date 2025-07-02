# NPM 发布助手 (npm-publish-easier)

[![npm version](https://badge.fury.io/js/@wemt%2Fnpm-publish-easier.svg)](https://badge.fury.io/js/@wemt%2Fnpm-publish-easier) [![Node.js Version](https://img.shields.io/node/v/@wemt/npm-publish-easier.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

一个简化 npm 包发布流程助手工具，支持自动构建、版本管理、文件复制和发布。

## ✨ 核心功能

- 🚀 **一键初始化** - 通过 `--init` 命令快速创建项目配置文件
- 🧹 **智能清理** - 通过 `--clean` 命令清理发布目录，保持工作环境整洁
- 🔒 **灵活的发布目录配置** - 支持独立发布目录或当前目录发布，完全隔离开发环境
- 📦 **智能文件复制** - 支持自定义复制规则，智能复制 LICENSE、README.md、docs 目录等必要文件
- 🔢 **灵活版本管理** - 支持控制是否自动递增版本号，可独立进行版本更新
- ⚡ **多种发布模式** - 支持准备模式、版本递增模式、完整发布模式等多种工作流
- 🛡️ **可配置过滤** - 支持自定义过滤规则，自动过滤开发相关的 scripts 和 devDependencies
- 🔨 **自定义构建** - 支持自定义构建命令，不局限于 rollup
- ⚙️ **完全配置驱动** - 基于用户配置文件运行，无硬编码默认值，适应各种项目结构
- 🌐 **跨平台兼容** - 完美支持 Windows、macOS 和 Linux 系统

## 📦 安装

### 全局安装（推荐）

```bash
npm install -g @wemt/npm-publish-easier
```

### 本地安装

```bash
npm install --save-dev @wemt/npm-publish-easier
```

## 🚀 使用方法

### 基本用法

```bash
# 首次使用：创建配置文件
npm-publish-easier --init

# 清理发布目录
npm-publish-easier --clean

# 准备发布文件
npm-publish-easier

# 自动发布到 npm（包含版本递增）
npm-publish-easier -y

# 只递增版本号，不发布
npm-publish-easier --increment-version

# 准备发布文件但不递增版本号
npm-publish-easier --no-increment-version

# 使用自定义构建命令
npm-publish-easier --build-command "npm run build"

# 显示帮助信息
npm-publish-easier --help
```

### 在 package.json 中配置 scripts

```json
{
  "scripts": {
    "publish": "npm-publish-easier -y",
    "publish:prepare": "npm-publish-easier",
    "publish:init": "npm-publish-easier --init",
    "publish:clean": "npm-publish-easier --clean",
    "version:bump": "npm-publish-easier --increment-version"
  }
}
```

然后使用：

```bash
npm run publish:init   # 创建配置文件
npm run publish:clean  # 清理发布目录
npm run publish        # 自动发布
npm run publish:prepare # 准备发布文件
npm run version:bump   # 仅递增版本号
```

## 📋 配置文件

### 快速开始

**首次使用**请先创建配置文件：

```bash
npm-publish-easier --init
```

这将在项目根目录创建 `publish.config.js` 配置文件，然后根据项目需要进行修改。

### 支持的配置文件

工具使用 `publish.config.js` 配置文件。

⚠️ **注意：配置文件是必需的，工具不会使用任何默认配置。**

### 配置文件示例

使用 `--init` 命令创建的默认配置：

```javascript
export default {
  // 自定义构建命令
  buildCommand: "npm run build",

  // 发布目录配置
  // "publish" - 在根目录下创建 publish 目录（默认）
  // "" - 直接在当前目录发布（不创建子目录）
  publishDir: "dist",

  // 自定义复制文件配置
  copyConfig: [
    {
      type: "file",
      source: "LICENSE",
      target: "LICENSE",
      description: "LICENSE",
    },
    {
      type: "file",
      source: "README.md",
      target: "README.md",
      description: "README.md",
    },
    {
      type: "dir",
      source: "docs",
      target: "docs",
      description: "docs directory",
    },
  ],

  // 自定义过滤配置
  filteredConfig: {
    scripts: ["publish", "test", "dev", "build"],
    devDependencies: ["@types/jest", "jest", "typescript", "rollup"],
  },
};
```

## 📋 参数说明

| 参数                     | 简写 | 说明                           |
| ------------------------ | ---- | ------------------------------ |
| `--init`                 | -    | 创建初始配置文件               |
| `--clean`                | -    | 清理发布目录                   |
| `--yes`                  | `-y` | 自动发布到 npm（包含版本递增） |
| `--increment-version`    | -    | 强制递增版本号（不发布）       |
| `--no-increment-version` | -    | 不递增版本号                   |
| `--build-command <cmd>`  | -    | 自定义构建命令                 |
| `--help`                 | `-h` | 显示帮助信息                   |

### 参数优先级

1. 命令行参数优先级最高
2. 配置文件中的设置次之
3. 默认设置优先级最低

## ⚠️ 注意事项

1. 确保已登录 npm 账户：`npm login`
2. 确保 package.json 中的 name 字段正确
3. 首次发布需要确保包名没有被占用
4. 建议在发布前先测试：`npm run publish:prepare`
5. 工具依赖构建工具进行构建，请确保构建配置正确
6. 版本号遵循 semver 规范，仅自动递增 patch 版本
7. 使用 `--clean` 命令会完全删除发布目录，请谨慎使用
8. 工具具有完整的跨平台兼容性，在 Windows、macOS 和 Linux 上均可正常使用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](https://opensource.org/licenses/MIT)

## 👨‍💻 作者

**Mutaoinc & Wemt Team**

---

如果这个工具对你有帮助，请给个 ⭐ Star 支持一下！
