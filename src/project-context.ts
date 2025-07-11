import { promises as fs } from 'fs';
import path from 'path';

export interface ProjectContext {
    projectPath: string;
}

let projectContext: ProjectContext | undefined;

/**
 * Initializes the project context. Must be called once at startup.
 * @param projectPath The absolute path to the Vendure project.
 */
export function initializeProjectContext(projectPath: string): void {
    if (projectContext) {
        throw new Error('Project context has already been initialized.');
    }
    projectContext = { projectPath };
}

export function getProjectContext(): ProjectContext {
    if (!projectContext) {
        throw new Error('Project context has not been initialized. Call initializeProjectContext first.');
    }
    return projectContext;
}

/**
 * Validates that the path points to a valid Vendure project.
 * @param projectPath The path to validate.
 */
export async function validateProjectPath(projectPath: string): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
        await fs.access(packageJsonPath);
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (!dependencies['@vendure/core']) {
            throw new Error('The directory does not appear to be a Vendure project.');
        }
    } catch (e) {
        throw new Error(
            `Invalid project path: ${projectPath}. Ensure it is a valid Vendure project directory. Original error: ${
                (e as Error).message
            }`,
        );
    }
}
