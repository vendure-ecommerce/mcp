import { z } from 'zod';

/**
 * Base schema for operations.
 * Project path is now determined at server startup, so it's not needed here.
 */
export const baseSchema = z.object({});

/**
 * Schema for the help tool
 */
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
