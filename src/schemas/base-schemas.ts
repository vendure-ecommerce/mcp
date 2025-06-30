import { z } from 'zod';

/**
 * Base schema for operations requiring a project path
 */
export const baseSchema = z.object({
    projectPath: z.string().describe('Path to the Vendure project directory (required)'),
});

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
