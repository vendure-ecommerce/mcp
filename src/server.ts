#!/usr/bin/env node

import { FastMCP } from 'fastmcp';

import { registerAllTools } from './commands/command-registry.js';
import { parseArgs } from './utils/server-args.js';

const server = new FastMCP({
    name: 'Vendure CLI Orchestrator',
    version: '1.0.0',
});

registerAllTools(server);

/**
 * Start the MCP server with the specified transport
 */
function startServer(): void {
    const { transport, port, host } = parseArgs();

    if (transport === 'http' || transport === 'httpStream') {
        console.log(`Starting Vendure CLI MCP Server (HTTP) on http://${host}:${port}/mcp`);
        void server.start({
            transportType: 'httpStream',
            httpStream: {
                endpoint: '/mcp',
                port,
            },
        });
    } else {
        console.log('Starting Vendure CLI MCP Server (STDIO)...');
        void server.start({
            transportType: 'stdio',
        });
    }
}

startServer();
