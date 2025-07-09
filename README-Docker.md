# Vendure MCP Server - Docker Setup

This guide explains how to run the Vendure MCP Server using Docker, which provides isolation and consistent environments.

## Quick Start: Using the Pre-built Image (Recommended)

This project is configured with GitHub Actions to automatically build and publish a Docker image to the GitHub Container Registry (`ghcr.io`). This means you don't need to build the image yourself.

### 1. Configure Your MCP Client

Add the following configuration to your MCP client (`mcp.json`, etc.). **You must use a hardcoded, absolute path** for the volume mount.

_Replace `YOUR_GITHUB_USERNAME/YOUR_REPO_NAME` with the actual path to the repository._

```json
{
    "mcpServers": {
        "vendure-mcp-docker": {
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-i",
                "--env",
                "PROJECT_PATH=/workspace",
                "--volume",
                "/absolute/path/to-your-vendure-project:/workspace",
                "vendure/mcp:latest",
                "--projectPath",
                "/workspace"
            ]
        }
    }
}
```

### 2. Ensure Docker is Running

That's it! As long as Docker is running, your MCP client will pull the latest image and use it.

---

## Manual Setup (For Development)

If you are developing the MCP server itself, you may want to build the image locally.

### 1. Build the Docker Image

```bash
# From the vendure-mcp directory
npm run docker:build

# Or manually:
docker build -t vendure-mcp .
```

### 2. Run with Docker

```bash
# Replace /path/to/your/vendure/project with your actual project path
docker run --rm -i \
  --volume "/path/to/your/vendure/project:/workspace" \
  vendure-mcp:latest \
  --projectPath /workspace
```

### 3. Use with MCP Client

Add this configuration to your MCP client's configuration file. **You must use a hardcoded, absolute path** for the volume mount, as variable substitution is not reliably supported by all clients.

```json
{
    "mcpServers": {
        "vendure-mcp-docker": {
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-i",
                "--env",
                "PROJECT_PATH=/workspace",
                "--volume",
                "/absolute/path-to-your-vendure-project:/workspace",
                "vendure-mcp:latest",
                "--projectPath",
                "/workspace"
            ]
        }
    }
}
```

## How It Works

1. **Project Mounting**: Your Vendure project is mounted into the container at `/workspace`
2. **Dependency Installation**: The container automatically installs your project's dependencies if needed
3. **Validation**: Ensures the mounted directory is a valid Vendure project
4. **MCP Communication**: The server communicates via STDIO with the MCP client

## Development with Docker Compose

For easier development and testing:

```bash
# Set your project path
export PROJECT_PATH="/path/to/your/vendure/project"

# Start in STDIO mode
docker-compose up vendure-mcp

# Or start in HTTP mode for debugging
docker-compose up vendure-mcp-http
```

## Troubleshooting

### "Project path does not exist"

- Ensure your project path in the volume mount is correct
- Use absolute paths, not relative paths
- On Windows, use forward slashes: `/c/Users/yourname/project`

### "Not a Vendure project"

- Ensure your project has `@vendure/core` in package.json dependencies
- Check that package.json exists in the mounted directory

### "Permission denied"

- On Linux/macOS, ensure Docker has permission to access the project directory
- You might need to add your user to the docker group
