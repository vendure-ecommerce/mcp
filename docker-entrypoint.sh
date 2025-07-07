#!/bin/sh
set -e

# Use the environment variable for the project path. Default to /workspace.
PROJECT_PATH=${PROJECT_PATH:-/workspace}

# All informational output should go to stderr to avoid corrupting the MCP JSON-RPC stream on stdout
echo "Vendure MCP Server starting..." >&2
echo "Project path for setup: $PROJECT_PATH" >&2

# Check if project path exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project path $PROJECT_PATH does not exist or is not mounted" >&2
    exit 1
fi

# Check if it's a valid Node.js project
if [ ! -f "$PROJECT_PATH/package.json" ]; then
    echo "Error: No package.json found in $PROJECT_PATH" >&2
    exit 1
fi

# Check if it's a Vendure project
if ! grep -q "@vendure/core" "$PROJECT_PATH/package.json"; then
    echo "Error: This does not appear to be a Vendure project (no @vendure/core dependency found)" >&2
    exit 1
fi

# Check if node_modules exists in the project, if not, install dependencies
if [ ! -d "$PROJECT_PATH/node_modules" ]; then
    echo "Installing project dependencies in $PROJECT_PATH..." >&2
    cd "$PROJECT_PATH"
    # Redirect npm output to stderr as well
    npm install >&2
    cd /app
else
    echo "Project dependencies already installed." >&2
fi

# Check if @vendure/cli is available in the project
if [ ! -f "$PROJECT_PATH/node_modules/.bin/vendure" ]; then
    echo "Warning: @vendure/cli not found in project dependencies. Some MCP tools may not work correctly." >&2
fi

echo "Starting Vendure MCP Server..." >&2

# Execute the MCP server, passing through all original arguments from the docker run command
exec node /app/dist/server.js "$@"
