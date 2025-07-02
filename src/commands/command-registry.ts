import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type { FastMCP } from 'fastmcp';

import { getProjectContext } from '../project-context.js';
import { analysisSchema } from '../schemas/index.js';
import { commandSchemas } from '../schemas/schema-generator.js';
import { executeMcpOperation } from '../utils/cli-executor.js';
import { convertToParameterName } from '../utils/command-parser.js';

import { analysisTasks } from './analysis-tasks-declarations.js';

export function registerAllTools(server: FastMCP): void {
    registerCliCommandTools(server);
    registerAnalysisTool(server);
}

function registerCliCommandTools(server: FastMCP): void {
    for (const command of cliCommands) {
        const commandSchema = commandSchemas[command.name];

        // Register main command
        server.addTool({
            name: `vendure_${command.name}`,
            description: command.description,
            ...(command.options && command.options.length > 0 && { parameters: commandSchema.mainCommand }),
            execute: async args => {
                const { projectPath } = getProjectContext();
                return executeMcpOperation(command.name, args, projectPath);
            },
        });

        // Register sub-commands
        if (commandSchema.subCommands) {
            for (const subCommandName of Object.keys(commandSchema.subCommands)) {
                const subCommandSchema = commandSchema.subCommands[subCommandName];
                const subCommandOption = command.options?.find(
                    o => convertToParameterName(o.long) === subCommandName,
                );

                server.addTool({
                    name: `vendure_${command.name}_${subCommandName}`,
                    description: `${subCommandOption?.description} (used in "vendure ${command.name}")`,
                    parameters: subCommandSchema,
                    execute: async args => {
                        const { projectPath } = getProjectContext();
                        const transformedArgs = { [subCommandName]: args.name, ...args };
                        return executeMcpOperation(command.name, transformedArgs, projectPath);
                    },
                });
            }
        }
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
