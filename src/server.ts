#!/usr/bin/env node

import { FastMCP } from 'fastmcp';

import { registerAllTools } from './commands/command-registry.js';
import { parseArgs } from './utils/server-args.js';

/**
 * Vendure CLI MCP Server
 * 
 * This server provides MCP (Model Context Protocol) tools for orchestrating
 * Vendure CLI operations, making it easy for AI agents to interact with 
 * Vendure projects.
 */

// Initialize the FastMCP server
const server = new FastMCP({
    name: 'Vendure CLI Orchestrator',
    version: '1.0.0',
});

// Register all tools with the server
registerAllTools(server);

/**
 * Start the MCP server with the specified transport
 */
function startServer(): void {
    const { transport, port, host } = parseArgs();

    if (transport === 'http' || transport === 'httpStream') {
        // eslint-disable-next-line no-console
        console.log(`Starting Vendure CLI MCP Server (HTTP) on http://${host}:${port}/mcp`);
        void server.start({
            transportType: 'httpStream',
            httpStream: {
                endpoint: '/mcp',
                port,
            },
        });
    } else {
        // Default to STDIO transport
        // eslint-disable-next-line no-console
        console.log('Starting Vendure CLI MCP Server (STDIO)...');
        void server.start({
            transportType: 'stdio',
        });
    }
}

// Start the server
startServer();
