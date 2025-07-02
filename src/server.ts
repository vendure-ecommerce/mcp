#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { randomUUID } from 'node:crypto';

import { registerAllTools } from './commands/command-registry.js';
import { initializeProjectContext, validateProjectPath } from './project-context.js';
import { parseArgs } from './utils/server-args.js';

async function main() {
    const { projectPath, transport, port, host } = parseArgs();

    try {
        await validateProjectPath(projectPath);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }

    initializeProjectContext(projectPath);

    const server = new McpServer({
        name: 'Vendure CLI Orchestrator',
        version: '1.0.0',
    });

    registerAllTools(server);

    if (transport === 'http') {
        console.log(`Starting Vendure CLI MCP Server (HTTP) on http://${host}:${port}/mcp`);
        console.log(`Project context: ${projectPath}`);

        const app = express();
        app.use(express.json());

        // Map to store transports by session ID
        const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

        // Handle POST requests for client-to-server communication
        app.post('/mcp', async (req, res) => {
            // Check for existing session ID
            const sessionId = req.headers['mcp-session-id'] as string | undefined;
            let httpTransport: StreamableHTTPServerTransport;

            if (sessionId && transports[sessionId]) {
                // Reuse existing transport
                httpTransport = transports[sessionId];
            } else if (!sessionId && isInitializeRequest(req.body)) {
                // New initialization request
                httpTransport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    onsessioninitialized: newSessionId => {
                        // Store the transport by session ID
                        transports[newSessionId] = httpTransport;
                    },
                });

                // Clean up transport when closed
                httpTransport.onclose = () => {
                    if (httpTransport.sessionId) {
                        delete transports[httpTransport.sessionId];
                    }
                };

                // Connect to the MCP server
                await server.connect(httpTransport);
            } else {
                // Invalid request
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided',
                    },
                    id: null,
                });
                return;
            }

            // Handle the request
            await httpTransport.handleRequest(req, res, req.body);
        });

        // Reusable handler for GET and DELETE requests
        const handleSessionRequest = async (req: express.Request, res: express.Response) => {
            const sessionId = req.headers['mcp-session-id'] as string | undefined;
            if (!sessionId || !transports[sessionId]) {
                res.status(400).send('Invalid or missing session ID');
                return;
            }

            const httpTransport = transports[sessionId];
            await httpTransport.handleRequest(req, res);
        };

        // Handle GET requests for server-to-client notifications via SSE
        app.get('/mcp', handleSessionRequest);

        // Handle DELETE requests for session termination
        app.delete('/mcp', handleSessionRequest);

        app.listen(port, host);
    } else {
        console.log(`Starting Vendure CLI MCP Server (STDIO) for project: ${projectPath}`);
        const stdioTransport = new StdioServerTransport();
        await server.connect(stdioTransport);
    }
}

main().catch(err => {
    console.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
});
