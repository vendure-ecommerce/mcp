import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import type { AddOperationOptions } from '@vendure/cli/dist/commands/add/add-operations.js';
import { performAddOperation } from '@vendure/cli/dist/commands/add/add-operations.js';

/**
 * Execute a Vendure CLI command by spawning the process
 */
export async function executeVendureCommand(args: string[], projectPath: string): Promise<string> {
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

        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || stdout));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Execute CLI operations through the MCP interface
 */
export async function executeMcpOperation(
    commandName: string,
    args: Record<string, any>,
): Promise<string> {
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

/**
 * Helper function to format MCP options to CLI arguments
 */
export function formatOptionsForCli(options: Record<string, any>): string[] {
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
