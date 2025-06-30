import { z } from 'zod';
import type {
    CliCommandDefinition,
    CliCommandOption,
} from '@vendure/cli/dist/shared/cli-command-definition.js';

import { enhancedParameterDescriptions } from './enhanced-descriptions.js';

/**
 * Utility function to convert CLI command options to Zod schema
 */
export function createZodSchemaFromCliOptions(command: CliCommandDefinition): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {
        projectPath: z.string().describe('Path to the Vendure project directory (required)'),
    };

    function processOptions(options: CliCommandOption[]) {
        for (const option of options) {
            // Extract the parameter name from the long option (e.g., '--plugin <n>' -> 'plugin')
            const paramName = option.long
                .replace(/^--/, '')
                .replace(/ .*$/, '')
                .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

            // Determine the type based on the option format
            let zodType: z.ZodTypeAny;

            if (option.long.includes('[') || option.long.includes('<')) {
                // Parameter accepts a value
                if (option.long.includes('[')) {
                    // Optional value (e.g., '--api-extension [plugin]')
                    zodType = z.union([z.string(), z.boolean()]).optional();
                } else {
                    // Required value (e.g., '--plugin <n>')
                    zodType = z.string();
                }
            } else {
                // Boolean flag
                zodType = z.boolean().optional();
            }

            // Use enhanced description if available, otherwise fall back to CLI description
            const enhancedDesc = enhancedParameterDescriptions[command.name]?.[paramName];
            const description = enhancedDesc || option.description;
            zodType = zodType.describe(description);

            if (!option.required) {
                zodType = zodType.optional();
            }

            schemaFields[paramName] = zodType;

            // Process sub-options recursively
            if (option.subOptions) {
                processOptions(option.subOptions);
            }
        }
    }

    if (command.options) {
        processOptions(command.options);
    }

    return z.object(schemaFields);
}
