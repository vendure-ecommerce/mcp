#!/usr/bin/env node

import type { AddOperationOptions } from '@vendure/cli/dist/commands/add/add-operations.js';
import { performAddOperation } from '@vendure/cli/dist/commands/add/add-operations.js';
import { cliCommands } from '@vendure/cli/dist/commands/command-declarations.js';
import type {
    CliCommandDefinition,
    CliCommandOption,
} from '@vendure/cli/dist/shared/cli-command-definition.js';
import { spawn } from 'child_process';
import { FastMCP } from 'fastmcp';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Import CLI command definitions and operations

const server = new FastMCP({
    name: 'Vendure CLI Orchestrator',
    version: '1.0.0',
});

// Base schema for simple operations
const baseSchema = z.object({
    projectPath: z.string().describe('Path to the Vendure project directory (required)'),
});

// Utility function to convert CLI command options to Zod schema
function createZodSchemaFromCliOptions(command: CliCommandDefinition): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {
        projectPath: z.string().describe('Path to the Vendure project directory (required)'),
    };

    function processOptions(options: CliCommandOption[]) {
        for (const option of options) {
            // Extract the parameter name from the long option (e.g., '--plugin <n>' -> 'plugin')
            const paramName = option.long
                .replace(/^--/, '')
                .replace(/ .*$/, '')
                .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

            // Determine the type based on the option format
            let zodType: z.ZodTypeAny;

            if (option.long.includes('[') || option.long.includes('<')) {
                // Parameter accepts a value
                if (option.long.includes('[')) {
                    // Optional value (e.g., '--job-queue [plugin]')
                    zodType = z.union([z.string(), z.boolean()]).optional();
                } else {
                    // Required value (e.g., '--plugin <n>')
                    zodType = z.string();
                }
            } else {
                // Boolean flag
                zodType = z.boolean().optional();
            }

            // Add description from CLI command
            zodType = zodType.describe(option.description);

            if (!option.required) {
                zodType = zodType.optional();
            }

            schemaFields[paramName] = zodType;

            // Process sub-options recursively
            if (option.subOptions) {
                processOptions(option.subOptions);
            }
        }
    }

    if (command.options) {
        processOptions(command.options);
    }

    return z.object(schemaFields);
}

// Legacy function for compatibility with non-add commands
async function executeVendureCommand(args: string[], projectPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Ensure we have an absolute path for the project
        const absoluteProjectPath = path.isAbsolute(projectPath)
            ? projectPath
            : path.resolve(process.cwd(), projectPath);

        // Find the vendure CLI executable in the project's node_modules
        const vendureBin = path.join(absoluteProjectPath, 'node_modules', '.bin', 'vendure');

        // Check if the project directory exists
        if (!fs.existsSync(absoluteProjectPath)) {
            reject(new Error(`Project directory does not exist: ${absoluteProjectPath}`));
            return;
        }

        // Check if the Vendure CLI exists
        if (!fs.existsSync(vendureBin)) {
            reject(
                new Error(
                    `Vendure CLI not found at: ${vendureBin}. Make sure the Vendure CLI is installed in the project (npm install @vendure/cli).`,
                ),
            );
            return;
        }

        const child = spawn(vendureBin, args, {
            cwd: absoluteProjectPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', data => {
            stdout += data.toString();
        });

        child.stderr?.on('data', data => {
            stderr += data.toString();
        });

        child.on('close', code => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || stdout));
            }
        });

        child.on('error', err => {
            reject(err);
        });
    });
}

// Utility function to execute CLI operations through the MCP interface
async function executeMcpOperation(commandName: string, args: Record<string, any>): Promise<string> {
    const { projectPath, ...options } = args;

    try {
        if (commandName === 'add') {
            // Use the CLI's performAddOperation function directly for better integration
            const result = await performAddOperation(options as AddOperationOptions);

            if (result.success) {
                return `✅ ${result.message}`;
            } else {
                throw new Error(result.message);
            }
        } else {
            // For other commands, fall back to spawning the CLI
            const cliArgs = [commandName, ...formatOptionsForCli(options)];
            const result = await executeVendureCommand(cliArgs, projectPath);
            return `✅ ${commandName} operation completed successfully.\n\nOutput:\n${result}`;
        }
    } catch (error) {
        throw new Error(
            `Failed to execute ${commandName}: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

// Helper function to format MCP options to CLI arguments
function formatOptionsForCli(options: Record<string, any>): string[] {
    const args: string[] = [];

    for (const [key, value] of Object.entries(options)) {
        if (value === undefined || value === false) continue;

        // Convert camelCase back to kebab-case
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const flag = `--${kebabKey}`;

        if (typeof value === 'boolean' && value === true) {
            args.push(flag);
        } else if (typeof value === 'string' || typeof value === 'number') {
            args.push(flag, String(value));
        }
    }

    return args;
}

// Dynamically register MCP tools based on CLI command definitions
for (const command of cliCommands) {
    const schema = createZodSchemaFromCliOptions(command);

    server.addTool({
        name: `vendure_${command.name}`,
        description: command.description,
        parameters: schema,
        execute: async args => {
            return await executeMcpOperation(command.name, args);
        },
    });
}

// Add a utility tool to list available commands
server.addTool({
    name: 'list_commands',
    description: 'List all available Vendure CLI commands accessible via MCP',
    parameters: baseSchema,
    // eslint-disable-next-line @typescript-eslint/require-await
    execute: async args => {
        const commandsList = cliCommands.map(cmd => `• ${cmd.name}: ${cmd.description}`).join('\n');

        return `Available Vendure CLI commands via MCP:\n\n${commandsList}\n\nProject path: ${args.projectPath}`;
    },
});

// Add project inspection tools that aren't available in CLI
server.addTool({
    name: 'list_plugins',
    description: 'List all plugins in the Vendure project by analyzing the project structure',
    parameters: baseSchema,
    execute: async args => {
        const { projectPath } = args;

        try {
            const absoluteProjectPath = path.isAbsolute(projectPath)
                ? projectPath
                : path.resolve(process.cwd(), projectPath);

            // Check if project directory exists
            if (!fs.existsSync(absoluteProjectPath)) {
                throw new Error(`Project directory does not exist: ${absoluteProjectPath}`);
            }

            const plugins: string[] = [];

            // Look for plugins in common locations
            const possiblePluginDirs = [
                path.join(absoluteProjectPath, 'src', 'plugins'),
                path.join(absoluteProjectPath, 'plugins'),
                path.join(absoluteProjectPath, 'src', 'custom-plugins'),
            ];

            for (const pluginDir of possiblePluginDirs) {
                if (fs.existsSync(pluginDir)) {
                    const items = fs.readdirSync(pluginDir, { withFileTypes: true });
                    for (const item of items) {
                        if (item.isDirectory()) {
                            // Look for plugin files
                            const pluginFiles = fs
                                .readdirSync(path.join(pluginDir, item.name))
                                .filter(file => file.endsWith('.plugin.ts') || file.endsWith('.plugin.js'));
                            if (pluginFiles.length > 0) {
                                plugins.push(`${item.name} (${pluginFiles.join(', ')})`);
                            }
                        }
                    }
                }
            }

            // Also check for plugins referenced in main config
            const configPaths = [
                path.join(absoluteProjectPath, 'src', 'vendure-config.ts'),
                path.join(absoluteProjectPath, 'vendure-config.ts'),
                path.join(absoluteProjectPath, 'src', 'index.ts'),
            ];

            const importedPlugins: string[] = [];
            for (const configPath of configPaths) {
                if (fs.existsSync(configPath)) {
                    const content = fs.readFileSync(configPath, 'utf8');
                    // Look for plugin imports (basic regex matching)
                    const pluginImports = content.match(/import.*Plugin.*from.*['"](.*)['"]/g) || [];
                    importedPlugins.push(...pluginImports.map(imp => imp.trim()));
                    break;
                }
            }

            let result = `📁 Vendure Project: ${absoluteProjectPath}\n\n`;

            if (plugins.length > 0) {
                result += `🔌 Custom Plugins Found (${plugins.length}):\n`;
                plugins.forEach(plugin => (result += `  • ${plugin}\n`));
                result += '\n';
            } else {
                result += '🔌 No custom plugins found in standard directories\n\n';
            }

            if (importedPlugins.length > 0) {
                result += `📦 Plugin Imports in Config (${importedPlugins.length}):\n`;
                importedPlugins.forEach(imp => (result += `  • ${imp}\n`));
                result += '\n';
            }

            result += '💡 Tip: Use `vendure_add` with `plugin` parameter to create new plugins';

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to analyze project: ${errorMessage}`);
        }
    },
});

server.addTool({
    name: 'analyze_project_structure',
    description:
        'Analyze the overall structure of a Vendure project including entities, services, and configuration',
    parameters: baseSchema,
    execute: async args => {
        const { projectPath } = args;

        try {
            const absoluteProjectPath = path.isAbsolute(projectPath)
                ? projectPath
                : path.resolve(process.cwd(), projectPath);

            if (!fs.existsSync(absoluteProjectPath)) {
                throw new Error(`Project directory does not exist: ${absoluteProjectPath}`);
            }

            const analysis = {
                entities: [] as string[],
                services: [] as string[],
                plugins: [] as string[],
                migrations: [] as string[],
                configFiles: [] as string[],
            };

            // Analyze src directory structure
            const srcDir = path.join(absoluteProjectPath, 'src');
            if (fs.existsSync(srcDir)) {
                const analyzeDirectory = (dir: string, category: keyof typeof analysis, pattern: RegExp) => {
                    if (fs.existsSync(dir)) {
                        const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
                        files.forEach(file => {
                            if (file.isFile() && pattern.test(file.name)) {
                                const filePath = file.path ?? '';
                                analysis[category].push(
                                    path.relative(srcDir, path.join(filePath, file.name)),
                                );
                            }
                        });
                    }
                };

                analyzeDirectory(srcDir, 'entities', /\.entity\.(ts|js)$/);
                analyzeDirectory(srcDir, 'services', /\.service\.(ts|js)$/);
                analyzeDirectory(srcDir, 'plugins', /\.plugin\.(ts|js)$/);
            }

            // Check for migrations
            const migrationDirs = [
                path.join(absoluteProjectPath, 'migrations'),
                path.join(absoluteProjectPath, 'src', 'migrations'),
            ];
            for (const migDir of migrationDirs) {
                if (fs.existsSync(migDir)) {
                    const migrations = fs
                        .readdirSync(migDir)
                        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
                    analysis.migrations.push(...migrations);
                    break;
                }
            }

            // Check for config files
            const configFiles = [
                'vendure-config.ts',
                'vendure-config.js',
                'src/vendure-config.ts',
                'src/vendure-config.js',
                'package.json',
                'tsconfig.json',
            ];
            configFiles.forEach(file => {
                if (fs.existsSync(path.join(absoluteProjectPath, file))) {
                    analysis.configFiles.push(file);
                }
            });

            let result = `📊 Project Structure Analysis: ${path.basename(absoluteProjectPath)}\n`;
            result += `📁 Path: ${absoluteProjectPath}\n\n`;

            result += `🏗️  Entities (${analysis.entities.length}):\n`;
            if (analysis.entities.length > 0) {
                analysis.entities.forEach(entity => (result += `  • ${entity}\n`));
            } else {
                result += '  No custom entities found\n';
            }
            result += '\n';

            result += `⚙️  Services (${analysis.services.length}):\n`;
            if (analysis.services.length > 0) {
                analysis.services.forEach(service => (result += `  • ${service}\n`));
            } else {
                result += '  No custom services found\n';
            }
            result += '\n';

            result += `🔌 Plugins (${analysis.plugins.length}):\n`;
            if (analysis.plugins.length > 0) {
                analysis.plugins.forEach(plugin => (result += `  • ${plugin}\n`));
            } else {
                result += '  No custom plugins found\n';
            }
            result += '\n';

            result += `🗄️  Migrations (${analysis.migrations.length}):\n`;
            if (analysis.migrations.length > 0) {
                analysis.migrations.slice(0, 5).forEach(migration => (result += `  • ${migration}\n`));
                if (analysis.migrations.length > 5) {
                    result += `  ... and ${analysis.migrations.length - 5} more\n`;
                }
            } else {
                result += '  No migrations found\n';
            }
            result += '\n';

            result += `📋 Config Files (${analysis.configFiles.length}):\n`;
            analysis.configFiles.forEach(config => (result += `  • ${config}\n`));

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to analyze project structure: ${errorMessage}`);
        }
    },
});

server.addTool({
    name: 'check_vendure_installation',
    description: 'Check if Vendure CLI is properly installed and what version is available in the project',
    parameters: baseSchema,
    execute: async args => {
        const { projectPath } = args;

        try {
            const absoluteProjectPath = path.isAbsolute(projectPath)
                ? projectPath
                : path.resolve(process.cwd(), projectPath);

            if (!fs.existsSync(absoluteProjectPath)) {
                throw new Error(`Project directory does not exist: ${absoluteProjectPath}`);
            }

            const vendureBin = path.join(absoluteProjectPath, 'node_modules', '.bin', 'vendure');
            const packageJsonPath = path.join(absoluteProjectPath, 'package.json');

            let result = `🔍 Vendure Installation Check: ${path.basename(absoluteProjectPath)}\n\n`;

            // Check if CLI binary exists
            if (fs.existsSync(vendureBin)) {
                result += '✅ Vendure CLI binary found\n';
                result += `📍 Location: ${vendureBin}\n`;
            } else {
                result += '❌ Vendure CLI binary not found\n';
                result += '💡 Install with: npm install @vendure/cli\n';
            }

            // Check package.json for Vendure dependencies
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const allDeps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                    ...packageJson.peerDependencies,
                };

                const vendureDeps = Object.entries(allDeps)
                    .filter(([name]) => name.startsWith('@vendure/'))
                    .sort();

                if (vendureDeps.length > 0) {
                    result += `\n📦 Vendure Dependencies (${vendureDeps.length}):\n`;
                    vendureDeps.forEach(([name, version]) => {
                        const versionStr = String(version);
                        result += `  • ${name}: ${versionStr}\n`;
                    });
                } else {
                    result += '\n❌ No Vendure dependencies found in package.json\n';
                }

                // Check Node.js and TypeScript versions
                result += '\n🔧 Environment:\n';
                if (allDeps.typescript) {
                    const tsVersion = String(allDeps.typescript);
                    result += `  • TypeScript: ${tsVersion}\n`;
                }
                if (allDeps['@types/node']) {
                    const nodeTypesVersion = String(allDeps['@types/node']);
                    result += `  • Node Types: ${nodeTypesVersion}\n`;
                }
                result += `  • Node.js: ${process.version}\n`;
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to check installation: ${errorMessage}`);
        }
    },
});

// Parse command line arguments to determine transport
function parseArgs() {
    const args = process.argv.slice(2);
    const transport = args.includes('--transport') ? args[args.indexOf('--transport') + 1] : 'stdio';
    const port = args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1], 10) : 8000;
    const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '127.0.0.1';

    return { transport, port, host };
}

function startServer() {
    const { transport, port, host } = parseArgs();

    if (transport === 'http' || transport === 'httpStream') {
        // eslint-disable-next-line no-console
        console.log(`Starting Vendure CLI MCP Server (HTTP) on http://${host}:${port}/mcp`);
        void server.start({
            transportType: 'httpStream',
            httpStream: {
                endpoint: '/mcp',
                port,
            },
        });
    } else {
        // Default to STDIO transport
        // eslint-disable-next-line no-console
        console.log('Starting Vendure CLI MCP Server (STDIO)...');
        void server.start({
            transportType: 'stdio',
        });
    }
}

// Start the server
startServer();
