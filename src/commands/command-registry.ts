import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { VendureDocsService } from '../utils/vendure-docs-service.js';

import { registerResources } from './resource-registry.js';
import { registerAnalysisTool, registerCliCommandTools, registerDocTool } from './tool-registry.js';

export function registerAll(server: McpServer): void {
    const vendureDocsService = new VendureDocsService();

    // Register all tools
    registerCliCommandTools(server);
    registerAnalysisTool(server);
    registerDocTool(server, vendureDocsService);

    // Register all resources
    registerResources(server, vendureDocsService);
}
