import { z } from 'zod';

/**
 * Base schema for operations.
 */
export const baseSchema = z.object({});

export const helpSchema = z.object({
    operation: z
        .enum([
            'api-extension',
            'entity',
            'service',
            'plugin',
            'job-queue',
            'ui-extensions',
            'codegen',
            'all',
        ])
        .optional()
        .describe('Specific operation to get help for, or "all" for complete guide'),
});
