import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type {
    CliCommandDefinition,
    CliCommandOption,
} from '@vendure/cli/dist/shared/cli-command-definition.js';
import { z } from 'zod';

function convertToParameterName(longOption: string): string {
    return longOption
        .replace(/^--/, '')
        .replace(/ .*$/, '')
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
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

function generateSchemaFromCommand(command: CliCommandDefinition): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    if (!command.options?.length) {
        return z.object({});
    }

    command.options.forEach(option => {
        const paramName = convertToParameterName(option.long);
        schemaFields[paramName] = createZodFieldFromOption(option);

        if (option.subOptions?.length) {
            option.subOptions.forEach(subOption => {
                const subParamName = convertToParameterName(subOption.long);
                schemaFields[subParamName] = createZodFieldFromOption(subOption);
            });
        }
    });

    return z.object(schemaFields);
}

export const commandSchemas: Record<string, z.ZodObject<any>> = cliCommands.reduce(
    (acc, command) => {
        acc[command.name] = generateSchemaFromCommand(command);
        return acc;
    },
    {} as Record<string, z.ZodObject<any>>,
);
