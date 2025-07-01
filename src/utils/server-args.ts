/**
 * Command line argument parsing utilities
 */

import path from 'path';

/**
 * Defines the arguments for starting the server.
 */
export interface ServerArgs {
    /**
     * The absolute path to the Vendure project directory.
     */
    projectPath: string;
}

/**
 * Parses command-line arguments to configure the server.
 * The server now operates in the context of a single project.
 * @returns The parsed server arguments.
 */
export function parseArgs(): ServerArgs {
    const rawArgs = process.argv.slice(2);
    let projectPath = process.cwd(); // Default to the current working directory

    const projectPathIndex = rawArgs.indexOf('--projectPath');
    if (projectPathIndex !== -1 && projectPathIndex + 1 < rawArgs.length) {
        projectPath = rawArgs[projectPathIndex + 1];
    }

    return {
        projectPath: path.resolve(projectPath),
    };
}
