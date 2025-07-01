import type {
    CliCommandDefinition,
    CliCommandOption,
} from '@vendure/cli/dist/shared/cli-command-definition.js';
import { z } from 'zod';

import { enhancedParameterDescriptions } from '../constants/enhanced-descriptions.constants.js';

export function createZodSchemaFromCliOptions(command: CliCommandDefinition): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {
        projectPath: z.string().describe('Path to the Vendure project directory (required)'),
    };

    function processOptions(options: CliCommandOption[]) {
        for (const option of options) {
            const paramName = option.long
                .replace(/^--/, '')
                .replace(/ .*$/, '')
                .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

            let zodType: z.ZodTypeAny;

            if (option.long.includes('[') || option.long.includes('<')) {
                if (option.long.includes('[')) {
                    zodType = z.string().optional();
                } else {
                    zodType = z.string();
                }
            } else {
                zodType = z.boolean().optional();
            }

            const enhancedDesc = enhancedParameterDescriptions[command.name]?.[paramName];
            const description = enhancedDesc || option.description;
            zodType = zodType.describe(description);

            if (!option.required) {
                zodType = zodType.optional();
            }

            schemaFields[paramName] = zodType;

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
