# NPM Publish Helper (npm-publish-easier)

[![npm version](https://badge.fury.io/js/@wemt%2Fnpm-publish-easier.svg)](https://badge.fury.io/js/@wemt%2Fnpm-publish-easier) [![Node.js Version](https://img.shields.io/node/v/@wemt/npm-publish-easier.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[简体中文](./README_zh.md) | **English**

A simplified npm package publishing helper tool that supports automatic building, version management, file copying, and publishing.

## ✨ Core Features

- 🚀 **One-click Initialization** - Quickly create project configuration files with the `--init` command
- 🧹 **Smart Cleanup** - Clean publish directories with the `--clean` command to keep your workspace tidy
- 🔒 **Flexible Publish Directory Configuration** - Support independent publish directories or current directory publishing, completely isolating development environment
- 📦 **Smart File Copying** - Support custom copy rules, intelligently copy necessary files like LICENSE, README.md, docs directory, etc.
- 🔢 **Flexible Version Management** - Support controlling whether to automatically increment version numbers, can independently perform version updates
- ⚡ **Multiple Publishing Modes** - Support preparation mode, version increment mode, full publish mode, and other workflows
- 🛡️ **Configurable Filtering** - Support custom filtering rules, automatically filter development-related scripts and devDependencies
- 🔨 **Custom Building** - Support custom build commands, not limited to rollup
- ⚙️ **Fully Configuration-Driven** - Run based on user configuration files, no hardcoded default values, adapts to various project structures
- 🌐 **Cross-Platform Compatible** - Perfect support for Windows, macOS, and Linux systems

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @wemt/npm-publish-easier
```

### Local Installation

```bash
npm install --save-dev @wemt/npm-publish-easier
```

## 🚀 Usage

### Basic Usage

```bash
# First use: Create configuration file
npm-publish-easier --init

# Clean publish directory
npm-publish-easier --clean

# Prepare publish files
npm-publish-easier

# Auto publish to npm (including version increment)
npm-publish-easier -y

# Only increment version number, don't publish
npm-publish-easier --increment-version

# Prepare publish files but don't increment version
npm-publish-easier --no-increment-version

# Use custom build command
npm-publish-easier --build-command "npm run build"

# Show help information
npm-publish-easier --help
```

### Configure scripts in package.json

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

Then use:

```bash
npm run publish:init   # Create configuration file
npm run publish:clean  # Clean publish directory
npm run publish        # Auto publish
npm run publish:prepare # Prepare publish files
npm run version:bump   # Only increment version
```

## 📋 Configuration File

### Quick Start

**For first-time use**, please create a configuration file first:

```bash
npm-publish-easier --init
```

This will create a `publish.config.js` configuration file in the project root directory, then modify it according to your project needs.

### Supported Configuration Files

The tool uses the `publish.config.js` configuration file.

⚠️ **Note: Configuration file is required, the tool will not use any default configuration.**

### Configuration File Example

Default configuration created with the `--init` command:

```javascript
export default {
  // Custom build command
  buildCommand: "npm run build",

  // Publish directory configuration
  // "publish" - Create publish directory under root (default)
  // "" - Publish directly in current directory (no subdirectory)
  publishDir: "dist",

  // Custom file copy configuration
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

  // Custom filter configuration
  filteredConfig: {
    scripts: ["publish", "test", "dev", "build"],
    devDependencies: ["@types/jest", "jest", "typescript", "rollup"],
  },
};
```

### 🔧 Build File Path Configuration

**Important Note:** Build output path must be consistent with `publishDir` configuration, or handle build file copying through `copyConfig`.

#### Option 1: Build Output Path Consistent with publishDir (Recommended)

If your build tool (like rollup, webpack, vite, etc.) outputs to the `dist` directory, then `publishDir` should also be set to `"dist"`:

```javascript
export default {
  // Build command outputs to dist directory
  buildCommand: "npm run build", // Assume this command outputs to dist/
  
  // Set publish directory to dist, consistent with build output
  publishDir: "dist",
  
  // Other files copied to dist directory via copyConfig
  copyConfig: [
    {
      type: "file",
      source: "LICENSE",
      target: "LICENSE",
      description: "LICENSE file",
    },
    {
      type: "file", 
      source: "README.md",
      target: "README.md",
      description: "README documentation",
    }
  ]
};
```

#### Option 2: Copy Build Files via copyConfig

If build outputs to other directories (like `lib`, `build`, etc.), you can copy build files to publish directory via `copyConfig`:

```javascript
export default {
  buildCommand: "npm run build", // Output to lib/ directory
  publishDir: "publish",
  
  copyConfig: [
    // Copy build output files
    {
      type: "dir",
      source: "lib",        // Build output directory
      target: "lib",        // Target path in publish directory
      description: "Build output files",
    },
    // Copy other necessary files
    {
      type: "file",
      source: "LICENSE",
      target: "LICENSE", 
      description: "LICENSE file",
    }
  ]
};
```

#### Option 3: Publish Directly in Current Directory

If build outputs directly to project root, you can set `publishDir` to empty string:

```javascript
export default {
  buildCommand: "npm run build", // Output directly to root directory
  publishDir: "",                // Publish in current directory
  
  // No need to copy build files as they're already in correct location
  copyConfig: [
    // Only copy other necessary files (if needed)
  ]
};
```

#### Common Build Tool Configuration Examples

**Rollup Configuration Example:**
```javascript
// rollup.config.js
export default {
  input: 'src/index.js',
  output: {
    file: 'publish/index.js',  // Output directly to publish directory
    format: 'esm',
    banner: '#!/usr/bin/env node\n'  // Shebang needed for CLI tools
  }
};

// publish.config.js
export default {
  buildCommand: "rollup -c",
  publishDir: "publish",  // Consistent with rollup output path
  // ...
};
```

**Webpack Configuration Example:**
```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),  // Output to dist directory
    filename: 'bundle.js'
  }
};

// publish.config.js
export default {
  buildCommand: "webpack --mode=production",
  publishDir: "dist",  // Consistent with webpack output path
  // ...
};
```

## 📋 Parameter Description

| Parameter                | Short | Description                                    |
| ------------------------ | ----- | ---------------------------------------------- |
| `--init`                 | -     | Create initial configuration file              |
| `--clean`                | -     | Clean publish directory                        |
| `--yes`                  | `-y`  | Auto publish to npm (including version increment) |
| `--increment-version`    | -     | Force increment version number (don't publish) |
| `--no-increment-version` | -     | Don't increment version number                 |
| `--build-command <cmd>`  | -     | Custom build command                           |
| `--help`                 | `-h`  | Show help information                          |

### Parameter Priority

1. Command line parameters have highest priority
2. Configuration file settings are next
3. Default settings have lowest priority

## ⚠️ Important Notes

1. Make sure you're logged into npm account: `npm login`
2. Ensure the name field in package.json is correct
3. For first-time publishing, ensure package name is not taken
4. **Important:** Build output path must be consistent with `publishDir` configuration, or handle build file copying through `copyConfig`
5. Recommend testing before publishing: `npm run publish:prepare`
6. Tool depends on build tools for building, please ensure build configuration is correct
7. Version numbers follow semver specification, only auto-increment patch version
8. Using `--clean` command will completely delete publish directory, use with caution
9. Tool has full cross-platform compatibility, works normally on Windows, macOS, and Linux

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

[MIT](https://opensource.org/licenses/MIT)

## 👨‍💻 Author

**Mutaoinc & Wemt Team**

---

If this tool helps you, please give it a ⭐ Star for support!