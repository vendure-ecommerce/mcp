# Vendure MCP Server

A standalone Model Context Protocol (MCP) server for Vendure CLI orchestration. This independent package allows external clients to interact with Vendure CLI commands in a programmatic way, enabling automation and integration with various MCP clients like Claude Desktop, Cursor, and other tools.

## 🚀 Features

- **🔧 CLI Integration**: Direct access to Vendure CLI `add` and `migrate` commands
- **📊 Project Analysis**: Analyze project structure, list plugins, entities, services
- **🔍 Environment Check**: Verify Vendure installation and dependencies
- **🌐 Dual Transport**: Support for both STDIO and HTTP transport protocols
- **⚡ Real-time**: Works with any Vendure project without modification

## 📦 Installation

### From npm (Recommended)

```bash
# Install globally for easy access
npm install -g vendure-mcp-server

# Or install locally in your project
npm install vendure-mcp-server
```

### From Source

```bash
git clone https://github.com/YOUR_USERNAME/vendure-mcp-server.git
cd vendure-mcp-server
npm install
npm run build
```

## 🎯 Usage

### Quick Start

```bash
# Start STDIO server (for MCP clients)
vendure-mcp

# Start HTTP server (for web-based clients)
vendure-mcp --transport http --port 8000
```

### MCP Client Configuration

#### Claude Desktop
Add to your `claude_desktop_config.json`:

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

#### Cursor (URL-based)
Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "vendure": {
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

Start the HTTP server:
```bash
vendure-mcp --transport http --port 8000
```

## 🛠️ Available Tools

### 1. `vendure_add` - Add Features to Project
Dynamically generated from Vendure CLI `add` command with support for:
- **Plugins**: Create new Vendure plugins
- **Entities**: Add custom entities with translatable/custom fields
- **Services**: Add business logic services
- **Job Queues**: Add background job processing
- **API Extensions**: Add custom GraphQL operations
- **UI Extensions**: Add Admin UI customizations

**Example:**
```json
{
  "projectPath": "/path/to/vendure/project",
  "plugin": "my-awesome-plugin"
}
```

### 2. `vendure_migrate` - Database Migration Operations
Handle database schema changes and migrations.

**Example:**
```json
{
  "projectPath": "/path/to/vendure/project"
}
```

### 3. `list_plugins` - Discover Project Plugins
Analyze and list all plugins in your Vendure project.

**Example:**
```json
{
  "projectPath": "/path/to/vendure/project"
}
```

### 4. `analyze_project_structure` - Full Project Analysis
Get comprehensive overview of your project including entities, services, plugins, migrations.

**Example:**
```json
{
  "projectPath": "/path/to/vendure/project"
}
```

### 5. `check_vendure_installation` - Environment Verification
Verify Vendure CLI installation and check project dependencies.

**Example:**
```json
{
  "projectPath": "/path/to/vendure/project"
}
```

## ⚙️ Configuration

### Transport Modes

#### STDIO (Default)
For traditional MCP clients:
```bash
vendure-mcp
# or
vendure-mcp --transport stdio
```

#### HTTP
For web-based clients and URL configuration:
```bash
vendure-mcp --transport http --port 8000 --host localhost
```

### Command Line Options

```bash
vendure-mcp [options]

Options:
  --transport <type>    Transport type: stdio (default) or http
  --port <number>       HTTP port (default: 8000, only for http transport)
  --host <string>       HTTP host (default: 127.0.0.1, only for http transport)
```

## 🏗️ Architecture

### Dynamic CLI Integration
The server dynamically generates MCP tools from Vendure CLI command definitions, ensuring:
- **Single source of truth**: CLI changes automatically reflect in MCP tools
- **Type safety**: Full TypeScript integration with proper parameter validation
- **Future-proof**: New CLI commands become available automatically

### Peer Dependencies
Uses `@vendure/cli` as a peer dependency, allowing:
- **Version flexibility**: Works with any compatible Vendure CLI version
- **No duplication**: Leverages existing CLI installation in projects
- **Clean separation**: Independent package without Vendure core dependency

## 🔧 Development

### Building from Source

```bash
git clone <your-repo>
cd vendure-mcp-server
npm install
npm run build
```

### Development Mode

```bash
# STDIO mode
npm run dev

# HTTP mode  
npm run dev:http
```

### Publishing

```bash
npm run build
npm publish
```

## 📋 Requirements

- **Node.js**: >= 18.0.0
- **Vendure CLI**: >= 3.0.0 (installed in target projects)
- **MCP Client**: Any MCP-compatible client

## 🎭 Error Handling

Comprehensive error handling includes:
- ✅ Project path validation
- ✅ Vendure CLI availability checks
- ✅ Parameter validation with detailed messages
- ✅ CLI execution error forwarding
- ✅ File system operation safety

## 🔒 Security

- **Path validation**: Prevents directory traversal attacks
- **Input sanitization**: All parameters validated against schemas
- **Isolated execution**: Commands run in specified project directories only
- **No elevated privileges**: Runs with standard user permissions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Vendure Documentation](https://www.vendure.io/docs/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/YOUR_USERNAME/vendure-mcp-server)

---

Made with ❤️ for the Vendure community 