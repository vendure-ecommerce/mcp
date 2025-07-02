import { z } from 'zod';

/**
 * Base schema for operations.
 */
export const baseSchema = z.object({});

export const analysisSchema = z.object({
    task: z
        .enum(['list_plugins', 'analyze_project_structure', 'check_vendure_installation'])
        .describe(
            'The analysis task to run:\n- list_plugins: Lists all discovered plugins in the project.\n- analyze_project_structure: Scans and analyzes the project folder structure.\n- check_vendure_installation: Checks if a Vendure project is correctly installed in the current directory.',
        ),
});
