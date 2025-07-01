import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type { FastMCP } from 'fastmcp';

import { getProjectContext } from '../project-context.js';
import { baseSchema, helpSchema } from '../schemas/index.js';
import { commandSchemas } from '../schemas/schema-generator.js';
import { generateHelpContent } from '../tools/help-tool.js';
import { analyzeProjectStructure, checkVendureInstallation, listPlugins } from '../tools/project-analyzer.js';
import { executeMcpOperation } from '../utils/cli-executor.js';

export function registerAllTools(server: FastMCP): void {
    registerCliCommandTools(server);
    registerUtilityTools(server);
    registerProjectAnalysisTools(server);
}

function registerCliCommandTools(server: FastMCP): void {
    for (const command of cliCommands) {
        const schema = commandSchemas[command.name];
        const hasOptions = command.options && command.options.length > 0;

        server.addTool({
            name: `vendure_${command.name}`,
            description: '',
            ...(hasOptions && { parameters: schema }),
            execute: async args => {
                const { projectPath } = getProjectContext();
                return await executeMcpOperation(command.name, args, projectPath);
            },
        });
    }
}

function registerUtilityTools(server: FastMCP): void {
    server.addTool({
        name: 'list_commands',
        description: '',
        parameters: baseSchema,
        execute: async () => {
            const { projectPath } = getProjectContext();
            const commandsList = cliCommands.map(cmd => `- ${cmd.name}: ${cmd.description}`).join('\n');
            return `Available Vendure CLI commands via MCP:\n\n${commandsList}\n\nProject path: ${projectPath}`;
        },
    });

    server.addTool({
        name: 'vendure_add_help',
        description: '',
        parameters: helpSchema,
        execute: async args => {
            return generateHelpContent(args.operation);
        },
    });
}

function registerProjectAnalysisTools(server: FastMCP): void {
    const { projectPath } = getProjectContext();
    server.addTool({
        name: 'list_plugins',
        description: '',
        parameters: baseSchema,
        execute: async () => {
            return listPlugins(projectPath);
        },
    });

    server.addTool({
        name: 'analyze_project_structure',
        description: '',
        parameters: baseSchema,
        execute: async () => {
            return analyzeProjectStructure(projectPath);
        },
    });

    server.addTool({
        name: 'check_vendure_installation',
        description: '',
        parameters: baseSchema,
        execute: async () => {
            return checkVendureInstallation(projectPath);
        },
    });
}
