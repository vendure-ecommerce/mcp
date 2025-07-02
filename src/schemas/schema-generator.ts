import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type {
    CliCommandDefinition,
    CliCommandOption,
} from '@vendure/cli/dist/shared/cli-command-definition.js';
import { z } from 'zod';

import { convertToParameterName } from '../utils/command-parser.js';

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
            option.subOptions.forEach(subOption => {
                const subParamName = convertToParameterName(subOption.long);
                subCommandFields[subParamName] = createZodFieldFromOption(subOption);
            });
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
