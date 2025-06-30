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

    // Enhanced descriptions for specific commands and parameters
    const enhancedDescriptions: Record<string, Record<string, string>> = {
        add: {
            plugin: 'Create a new plugin with the specified name. Example: "MyNewPlugin"',
            entity: 'Add a new entity with the specified class name. Example: "Product" or "Customer". Requires selectedPlugin to be specified.',
            selectedPlugin: 'Name of the plugin to add the entity/service/api-extension to. Must be an existing plugin name. Example: "my-plugin" or "test-plugin"',
            service: 'Add a new service with the specified class name. Example: "ProductService" or "OrderService". Requires selectedPlugin to be specified.',
            type: 'Type of service: "basic" or "entity" (default: basic). Use "entity" when working with database entities.',
            selectedEntity: 'Name of the entity for entity service (automatically sets type to entity). Example: "Product"',
            jobQueue: 'Add job-queue support to the specified plugin. Provide the plugin name. Example: "my-plugin"',
            name: 'Name for the job queue (required with jobQueue). Example: "email-queue" or "product-import-queue"',
            selectedService: 'Name of the service to add the job queue or API extension to. Must be an existing service. Example: "ProductService"',
            codegen: 'Add GraphQL codegen configuration to the specified plugin. Provide the plugin name. Example: "my-plugin"',
            apiExtension: 'Add an API extension scaffold to the specified plugin. Provide the plugin name. Example: "my-plugin". Requires queryName or mutationName and selectedService.',
            queryName: 'Name for the GraphQL query (used with apiExtension). Example: "customProducts" or "getSpecialOffers"',
            mutationName: 'Name for the GraphQL mutation (used with apiExtension). Example: "createCustomOrder" or "updateSpecialPrice"',
            uiExtensions: 'Add Admin UI extensions setup to the specified plugin. Provide the plugin name. Example: "my-plugin"',
            customFields: 'Add custom fields support to the entity (boolean flag)',
            translatable: 'Make the entity translatable (boolean flag)',
            config: 'Specify the path to a custom Vendure config file. Example: "./custom-vendure-config.ts"'
        }
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
                    // Optional value (e.g., '--api-extension [plugin]')
                    zodType = z.union([z.string(), z.boolean()]).optional();
                } else {
                    // Required value (e.g., '--plugin <n>')
                    zodType = z.string();
                }
            } else {
                // Boolean flag
                zodType = z.boolean().optional();
            }

            // Use enhanced description if available, otherwise fall back to CLI description
            const enhancedDesc = enhancedDescriptions[command.name]?.[paramName];
            const description = enhancedDesc || option.description;
            zodType = zodType.describe(description);

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

// Enhanced command descriptions for better AI agent understanding
const enhancedCommandDescriptions: Record<string, string> = {
    add: `Add features to your Vendure project. 

IMPORTANT USAGE PATTERNS:
- For API Extension: Requires apiExtension="plugin-name", plus queryName OR mutationName, plus selectedService
- For Entity: Requires entity="EntityName" and selectedPlugin="plugin-name"  
- For Service: Requires service="ServiceName" and selectedPlugin="plugin-name"
- For Job Queue: Requires jobQueue="plugin-name", name="queue-name", and selectedService="service-name"

EXAMPLES:
- Add API extension: {apiExtension: "my-plugin", queryName: "customProducts", selectedService: "ProductService"}
- Add entity: {entity: "CustomProduct", selectedPlugin: "my-plugin"}
- Add service: {service: "CustomService", selectedPlugin: "my-plugin"}
- Create new plugin: {plugin: "MyNewPlugin"}

Use list_plugins tool first to see available plugin names.`
};

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
    
    // Use enhanced description if available, otherwise fall back to CLI description
    const description = enhancedCommandDescriptions[command.name] || command.description;

    server.addTool({
        name: `vendure_${command.name}`,
        description: description,
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

// Add a helper tool for understanding how to use vendure_add
server.addTool({
    name: 'vendure_add_help',
    description: 'Get detailed guidance on how to use the vendure_add tool with correct parameter combinations',
    parameters: z.object({
        operation: z.enum(['api-extension', 'entity', 'service', 'plugin', 'job-queue', 'ui-extensions', 'codegen', 'all']).optional().describe('Specific operation to get help for, or "all" for complete guide')
    }),
    // eslint-disable-next-line @typescript-eslint/require-await
    execute: async args => {
        const guides: Record<string, string> = {
            'api-extension': `
📋 API EXTENSION GUIDE:

Required Parameters:
- projectPath: "/path/to/vendure/project"
- apiExtension: "plugin-name" (must be existing plugin)
- selectedService: "ServiceName" (must be existing service in the plugin)
- queryName: "customQueryName" OR mutationName: "customMutationName" (at least one required)

Example:
{
  "projectPath": "/path/to/project",
  "apiExtension": "my-plugin",
  "queryName": "getCustomProducts", 
  "selectedService": "ProductService"
}

💡 TIP: Use list_plugins tool first to see available plugins and services.`,

            'entity': `
📋 ENTITY GUIDE:

Required Parameters:
- projectPath: "/path/to/vendure/project"
- entity: "EntityClassName" (PascalCase)
- selectedPlugin: "plugin-name" (must be existing plugin)

Optional Parameters:
- customFields: true (adds custom fields support)
- translatable: true (makes entity translatable)

Example:
{
  "projectPath": "/path/to/project",
  "entity": "CustomProduct",
  "selectedPlugin": "my-plugin",
  "customFields": true
}`,

            'service': `
📋 SERVICE GUIDE:

Required Parameters:
- projectPath: "/path/to/vendure/project"
- service: "ServiceClassName" (PascalCase)
- selectedPlugin: "plugin-name" (must be existing plugin)

Optional Parameters:
- type: "basic" | "entity" (default: basic)
- selectedEntity: "EntityName" (auto-sets type to entity)

Example:
{
  "projectPath": "/path/to/project",
  "service": "CustomProductService",
  "selectedPlugin": "my-plugin",
  "type": "entity",
  "selectedEntity": "Product"
}`,

            'plugin': `
📋 PLUGIN GUIDE:

Required Parameters:
- projectPath: "/path/to/vendure/project" 
- plugin: "PluginName" (PascalCase)

Example:
{
  "projectPath": "/path/to/project",
  "plugin": "MyAwesomePlugin"
}`,

            'job-queue': `
📋 JOB QUEUE GUIDE:

Required Parameters:
- projectPath: "/path/to/vendure/project"
- jobQueue: "plugin-name" (must be existing plugin)
- name: "queue-name" (kebab-case recommended)
- selectedService: "ServiceName" (must be existing service)

Example:
{
  "projectPath": "/path/to/project",
  "jobQueue": "my-plugin",
  "name": "email-sending-queue",
  "selectedService": "EmailService"
}`
        };

        if (args.operation && args.operation !== 'all') {
            return guides[args.operation] || `No guide available for operation: ${args.operation}`;
        }

        return `
🔧 VENDURE ADD TOOL COMPLETE GUIDE:

${Object.entries(guides).map(([op, guide]) => guide).join('\n\n')}

⚠️  COMMON MISTAKES TO AVOID:
1. Using non-existent plugin names (use list_plugins first)
2. Missing required parameter combinations
3. Wrong casing (use PascalCase for class names, kebab-case for plugin names)
4. For API extensions: forgetting selectedService or query/mutation names

🔍 DISCOVERY TOOLS:
- list_plugins: See all available plugins and their services
- vendure_add_help: Get specific guidance for operations
`;
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
