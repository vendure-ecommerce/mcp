import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { VendureDocsService } from '../utils/vendure-docs-service.js';

export function registerResources(server: McpServer, vendureDocsService: VendureDocsService): void {
    // Register llms.txt resource
    server.registerResource(
        'vendure-llms-txt',
        'vendure://llms.txt',
        {
            name: 'Vendure Documentation Overview',
            description: 'Structured overview of Vendure concepts and documentation links for AI context',
            mimeType: 'text/plain',
        },
        async (uri: URL) => {
            const llmsContent = await vendureDocsService.getLlmsTxt();
            return {
                contents: [
                    {
                        uri: uri.toString(),
                        text: llmsContent,
                    },
                ],
            };
        },
    );

    // Register llms-full.txt resource
    server.registerResource(
        'vendure-llms-full-txt',
        'vendure://llms-full.txt',
        {
            name: 'Comprehensive Vendure Documentation',
            description: 'Complete Vendure documentation and API reference for detailed context',
            mimeType: 'text/plain',
        },
        async (uri: URL) => {
            const llmsFullContent = await vendureDocsService.getLlmsFullTxt();
            return {
                contents: [
                    {
                        uri: uri.toString(),
                        text: llmsFullContent,
                    },
                ],
            };
        },
    );
}
