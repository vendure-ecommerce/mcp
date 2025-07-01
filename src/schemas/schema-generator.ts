import { z } from 'zod';

export function createZodSchemaFromCliOptions(): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    return z.object(schemaFields);
}
