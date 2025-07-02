import path from 'path';

export function parseArgs() {
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
