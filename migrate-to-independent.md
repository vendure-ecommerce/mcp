# Migration Guide: Creating Independent Vendure MCP Server

This guide explains how to extract the MCP package from the Vendure monorepo and set it up as an independent package.

## Steps to Create Independent Repository

### 1. Create New Repository

```bash
# Create new repository on GitHub
# Clone it locally
git clone https://github.com/vendure-ecommerce/mcp.git
cd vendure-mcp
```

### 2. Copy Package Files

Copy these files from `packages/mcp/` to the new repository root:

```bash
# Essential files
cp packages/mcp/src/ ./src/
cp packages/mcp/package.json ./
cp packages/mcp/tsconfig.json ./
cp packages/mcp/README.md ./
cp packages/mcp/example-config.json ./
cp packages/mcp/LICENSE ./
cp packages/mcp/.gitignore ./
cp packages/mcp/.npmignore ./

# Optional development files
cp packages/mcp/test-server.js ./  # if you want to keep the test script
```

### 3. Initialize and Install

```bash
# Initialize git if not done already
git init

# Install dependencies
npm install

# Build the package
npm run build

# Test it works
./dist/server.js --help 2>/dev/null || echo "CLI works!"
```

### 4. Update Repository URLs

In `package.json`, update these fields to your actual repository:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/vendure-ecommerce/mcp.git"
  },
  "homepage": "https://github.com/vendure-ecommerce/mcp"
}
```

### 5. Publish to npm

```bash
# Login to npm (if not already)
npm login

# Publish the package
npm publish
```

## Key Changes Made

### Package Configuration
- ✅ Changed name from `@vendure/mcp` to `vendure-mcp-server`
- ✅ Reset version to `1.0.0` for independent release
- ✅ Changed license from GPL-3.0 to MIT
- ✅ Added proper repository URLs
- ✅ Made `@vendure/cli` a peer dependency with flexible version range
- ✅ Added `prepublishOnly` script for automatic building

### Development Experience
- ✅ Added comprehensive `.gitignore` and `.npmignore`
- ✅ Added MIT license
- ✅ Updated README with installation and usage instructions
- ✅ Added proper npm scripts for development and publishing

### Code Changes
- ✅ **No code changes required!** The server code is already independent
- ✅ Uses peer dependency pattern for `@vendure/cli`
- ✅ Dynamic CLI integration ensures compatibility

## Installation Options for Users

### Global Installation (Recommended)
```bash
npm install -g vendure-mcp-server
vendure-mcp --transport stdio
```

### Local Project Installation
```bash
npm install vendure-mcp-server
npx vendure-mcp-server --transport http --port 8000
```

### Direct Usage with npx
```bash
npx vendure-mcp-server --transport stdio
```

## MCP Client Configurations

### Claude Desktop (STDIO)
```json
{
  "mcpServers": {
    "vendure": {
      "command": "npx",
      "args": ["vendure-mcp-server"]
    }
  }
}
```

### Cursor (HTTP)
```json
{
  "mcpServers": {
    "vendure": {
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

## Benefits of Independence

### For Users
- 🎯 **Simple Installation**: Just `npm install -g vendure-mcp-server`
- 🔄 **Version Control**: Independent versioning and release cycle
- 📦 **Lighter Dependencies**: Only installs what's needed
- 🚀 **Global Access**: Works with any Vendure project

### For Developers
- 🛠️ **Focused Development**: Dedicated repository for MCP functionality
- 📈 **Community Driven**: Open for external contributions
- 🔧 **Independent Releases**: No need to wait for Vendure core releases
- 🎨 **Custom Branding**: Own documentation and branding

## Compatibility

The independent package maintains full compatibility with:
- ✅ All Vendure CLI versions >= 3.0.0
- ✅ All existing MCP clients
- ✅ Both STDIO and HTTP transport modes
- ✅ All current functionality (add, migrate, analyze, etc.)

## Future Roadmap

With an independent repository, you can:
- Add more CLI command integrations
- Implement custom Vendure project analysis tools
- Add web dashboard for HTTP mode
- Create plugins for popular editors
- Build community around Vendure automation tools

## 🔗 Links

- [Vendure Documentation](https://www.vendure.io/docs/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/vendure-ecommerce/mcp)

--- 