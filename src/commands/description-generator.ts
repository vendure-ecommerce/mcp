import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type {
    CliCommandDefinition,
    CliCommandOption,
} from '@vendure/cli/dist/shared/cli-command-definition.js';

function convertToParameterName(longOption: string): string {
    return longOption
        .replace(/^--/, '')
        .replace(/ .*$/, '')
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function generateParameterDocumentation(options: CliCommandOption[], level = 0): string {
    const indent = '  '.repeat(level);
    return options
        .map(option => {
            const paramName = convertToParameterName(option.long);
            const isRequired = option.required || option.description.includes('required with');
            const requiredIndicator = isRequired ? ' (REQUIRED)' : '';

            let doc = `${indent}- ${paramName}${requiredIndicator}: ${option.description}`;

            if (option.subOptions?.length) {
                doc += '\n' + generateParameterDocumentation(option.subOptions, level + 1);
            }

            return doc;
        })
        .join('\n');
}

function generateEnhancedDescription(command: CliCommandDefinition): string {
    const baseDescription = command.description;

    if (!command.options?.length) {
        return baseDescription;
    }

    const parametersSection = generateParameterDocumentation(command.options);

    return `${baseDescription}

PARAMETERS:
${parametersSection}`;
}

export const enhancedCommandDescriptions: Record<string, string> = cliCommands.reduce(
    (acc, command) => {
        acc[command.name] = generateEnhancedDescription(command);
        return acc;
    },
    {} as Record<string, string>,
);
