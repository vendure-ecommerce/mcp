import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type {
    CliCommandDefinition,
    CliCommandOption,
} from '@vendure/cli/dist/shared/cli-command-definition.js';
import { z } from 'zod';

import { convertToParameterName } from '../utils/command-parser.js';

/**
 * Extracts the main parameter info from option strings like '--entity <name>' or '--job-queue [plugin]'
 */
function extractMainParameter(
    optionLong: string,
): { name: string; required: boolean; description: string } | null {
    const requiredMatch = optionLong.match(/--([\w-]+) <([^>]+)>/);
    if (requiredMatch) {
        const entityType = requiredMatch[1].replace(/-/g, ' '); // Convert kebab-case to readable format

        return {
            name: 'name', // Always use 'name' to match execution code expectation
            required: true,
            description: `The name of the ${entityType} to create`,
        };
    }

    const optionalMatch = optionLong.match(/--([\w-]+) \[([^\]]+)\]/);
    if (optionalMatch) {
        const entityType = optionalMatch[1].replace(/-/g, ' '); // Convert kebab-case to readable format

        return {
            name: 'name', // Always use 'name' to match execution code expectation
            required: false,
            description: `The name of the ${entityType} to use (optional)`,
        };
    }

    return null;
}

function createZodFieldFromOption(option: CliCommandOption): z.ZodTypeAny {
    const hasValue = option.long.includes('<') || option.long.includes('[');

    if (!hasValue) {
        return z.boolean().optional().describe(option.description);
    }

    if (option.long.includes('[')) {
        return z.string().optional().describe(option.description);
    }

    const isRequired = option.required || option.description.includes('required with');
    const baseType = z.string().describe(option.description);

    return isRequired ? baseType : baseType.optional();
}

function generateSchemaFromCommand(command: CliCommandDefinition) {
    const mainCommandFields: Record<string, z.ZodTypeAny> = {};
    const subCommandSchemas: Record<string, z.ZodObject<any>> = {};

    if (!command.options?.length) {
        return z.object({
            mainCommand: z.object({}),
            subCommands: z.object({}),
        });
    }

    command.options.forEach(option => {
        const paramName = convertToParameterName(option.long);

        if (option.subOptions?.length) {
            const subCommandFields: Record<string, z.ZodTypeAny> = {};

            // Add all the sub-options first
            option.subOptions.forEach(subOption => {
                const subParamName = convertToParameterName(subOption.long);
                subCommandFields[subParamName] = createZodFieldFromOption(subOption);
            });

            // Extract the main parameter from the parent option (e.g., <name> from '--entity <name>')
            const mainParam = extractMainParameter(option.long);
            if (mainParam) {
                const baseType = z.string().describe(mainParam.description);
                // If there's already a 'name' field from subOptions, use a different name
                const mainParamName = subCommandFields.name ? 'value' : 'name';
                subCommandFields[mainParamName] = mainParam.required ? baseType : baseType.optional();
            }

            subCommandSchemas[paramName] = z.object(subCommandFields);
        } else {
            mainCommandFields[paramName] = createZodFieldFromOption(option);
        }
    });

    return {
        mainCommand: z.object(mainCommandFields),
        subCommands: subCommandSchemas,
    };
}

export const commandSchemas: Record<string, any> = cliCommands.reduce(
    (acc, command) => {
        acc[command.name] = generateSchemaFromCommand(command);
        return acc;
    },
    {} as Record<string, any>,
);
