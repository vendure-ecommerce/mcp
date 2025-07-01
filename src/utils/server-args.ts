/**
 * Command line argument parsing utilities
 */

import path from 'path';

/**
 * Defines the arguments for starting the server.
 */
export interface ServerArgs {
    /** The communication transport to use. */
    transport: 'stdio' | 'http';
    /** The port for the HTTP server. */
    port: number;
    /** The host for the HTTP server. */
    host: string;
    /** The absolute path to the Vendure project directory. */
    projectPath: string;
}

/**
 * Parses command-line arguments to configure the server.
 * The server operates in the context of a single project,
 * which can be exposed via STDIO or HTTP.
 * @returns The parsed server arguments.
 */
export function parseArgs(): ServerArgs {
    const rawArgs = process.argv.slice(2);

    const transportArg = rawArgs.includes('--transport')
        ? rawArgs[rawArgs.indexOf('--transport') + 1]
        : 'stdio';
    const transport = transportArg === 'http' ? 'http' : 'stdio';

    const port = rawArgs.includes('--port') ? parseInt(rawArgs[rawArgs.indexOf('--port') + 1], 10) : 8000;
    const host = rawArgs.includes('--host') ? rawArgs[rawArgs.indexOf('--host') + 1] : '127.0.0.1';

    let projectPath = process.cwd();
    const projectPathIndex = rawArgs.indexOf('--projectPath');
    if (projectPathIndex !== -1 && projectPathIndex + 1 < rawArgs.length) {
        projectPath = rawArgs[projectPathIndex + 1];
    }

    return {
        transport,
        port,
        host,
        projectPath: path.resolve(projectPath),
    };
}
