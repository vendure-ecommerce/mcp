import { z } from 'zod';

import { analysisTasks } from '../commands/analysis-tasks-declarations.js';

const taskNames = analysisTasks.map(t => t.name) as [string, ...string[]];
const taskDescriptions = analysisTasks.map(t => `- ${t.name}: ${t.description}`).join('\n');

export const analysisSchema = z.object({
    task: z.enum(taskNames).describe(`The analysis task to run:\n${taskDescriptions}`),
});
