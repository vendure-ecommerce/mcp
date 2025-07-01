#!/usr/bin/env node

import { FastMCP } from 'fastmcp';

import { registerAllTools } from './commands/command-registry.js';
import { initializeProjectContext, validateProjectPath } from './project-context.js';
import { parseArgs } from './utils/server-args.js';

async function main() {
    const { projectPath } = parseArgs();

    try {
        await validateProjectPath(projectPath);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }

    initializeProjectContext(projectPath);

    const server = new FastMCP({
        name: 'Vendure CLI Orchestrator',
        version: '1.0.0',
    });

    registerAllTools(server);

    console.log(`Starting Vendure CLI MCP Server (STDIO) for project: ${projectPath}`);
    void server.start({
        transportType: 'stdio',
    });
}

main().catch(err => {
    console.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
});
