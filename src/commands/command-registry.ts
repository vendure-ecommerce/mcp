import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type { FastMCP } from 'fastmcp';

import { getProjectContext } from '../project-context.js';
import { analysisSchema } from '../schemas/index.js';
import { commandSchemas } from '../schemas/schema-generator.js';
import { executeMcpOperation } from '../utils/cli-executor.js';

import { analysisTasks } from './analysis-tasks-declarations.js';

export function registerAllTools(server: FastMCP): void {
    registerCliCommandTools(server);
    registerAnalysisTool(server);
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

function registerAnalysisTool(server: FastMCP): void {
    server.addTool({
        name: 'vendure_analyse',
        description: 'Run a project analysis task. Specify which analysis to run.',
        parameters: analysisSchema,
        execute: async ({ task }) => {
            const { projectPath } = getProjectContext();
            const selectedTask = analysisTasks.find(t => t.name === task);
            if (!selectedTask) {
                return `Error: Analysis task "${task}" not found.`;
            }
            return selectedTask.handler(projectPath);
        },
    });
}
