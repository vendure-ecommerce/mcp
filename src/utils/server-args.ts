/**
 * Command line argument parsing utilities
 */

export interface ServerArgs {
    transport: string;
    port: number;
    host: string;
}

/**
 * Parse command line arguments to determine transport configuration
 */
export function parseArgs(): ServerArgs {
    const args = process.argv.slice(2);
    const transport = args.includes('--transport') ? args[args.indexOf('--transport') + 1] : 'stdio';
    const port = args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1], 10) : 8000;
    const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '127.0.0.1';

    return { transport, port, host };
}
