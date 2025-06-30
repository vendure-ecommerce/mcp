import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type { FastMCP } from 'fastmcp';

import { enhancedCommandDescriptions } from '../constants/enhanced-descriptions.constants.js';
import { baseSchema, createZodSchemaFromCliOptions, helpSchema } from '../schemas/index.js';
import { generateHelpContent } from '../tools/help-tool.js';
import { analyzeProjectStructure, checkVendureInstallation, listPlugins } from '../tools/project-analyzer.js';
import { executeMcpOperation } from '../utils/cli-executor.js';

/**
 * Register all MCP tools with the FastMCP server
 */
export function registerAllTools(server: FastMCP): void {
    registerCliCommandTools(server);
    registerUtilityTools(server);
    registerProjectAnalysisTools(server);
}

/**
 * Register tools based on CLI command definitions
 */
function registerCliCommandTools(server: FastMCP): void {
    for (const command of cliCommands) {
        const schema = createZodSchemaFromCliOptions(command);
        const description = enhancedCommandDescriptions[command.name] || command.description;

        server.addTool({
            name: `vendure_${command.name}`,
            description: description,
            parameters: schema,
            execute: async args => {
                return await executeMcpOperation(command.name, args);
            },
        });
    }
}

/**
 * Register utility tools (list commands, help)
 */
function registerUtilityTools(server: FastMCP): void {
    server.addTool({
        name: 'list_commands',
        description: 'List all available Vendure CLI commands accessible via MCP',
        parameters: baseSchema,
        execute: async args => {
            const commandsList = cliCommands.map(cmd => `- ${cmd.name}: ${cmd.description}`).join('\n');
            return `Available Vendure CLI commands via MCP:\n\n${commandsList}\n\nProject path: ${args.projectPath}`;
        },
    });

    server.addTool({
        name: 'vendure_add_help',
        description:
            'Get detailed guidance on how to use the vendure_add tool with correct parameter combinations',
        parameters: helpSchema,
        execute: async args => {
            return generateHelpContent(args.operation);
        },
    });
}

/**
 * Register project analysis tools
 */
function registerProjectAnalysisTools(server: FastMCP): void {
    server.addTool({
        name: 'list_plugins',
        description: 'List all plugins in the Vendure project by analyzing the project structure',
        parameters: baseSchema,
        execute: async args => {
            return listPlugins(args.projectPath);
        },
    });

    server.addTool({
        name: 'analyze_project_structure',
        description:
            'Analyze the overall structure of a Vendure project including entities, services, and configuration',
        parameters: baseSchema,
        execute: async args => {
            return analyzeProjectStructure(args.projectPath);
        },
    });

    server.addTool({
        name: 'check_vendure_installation',
        description:
            'Check if Vendure CLI is properly installed and what version is available in the project',
        parameters: baseSchema,
        execute: async args => {
            return checkVendureInstallation(args.projectPath);
        },
    });
}
