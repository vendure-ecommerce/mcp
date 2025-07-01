import type { AddOperationOptions } from '@vendure/cli/dist/commands/add/add-operations.js';
import { performAddOperation } from '@vendure/cli/dist/commands/add/add-operations.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function executeVendureCommand(args: string[], projectPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const vendureBin = path.join(projectPath, 'node_modules', '.bin', 'vendure');

        if (!fs.existsSync(projectPath)) {
            reject(new Error(`Project directory does not exist: ${projectPath}`));
            return;
        }

        if (!fs.existsSync(vendureBin)) {
            reject(
                new Error(
                    `Vendure CLI not found at: ${vendureBin}. Make sure @vendure/cli is installed in the project.`,
                ),
            );
            return;
        }

        const child = spawn(vendureBin, args, {
            cwd: projectPath,
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
                reject(new Error(stderr || stdout || `Command exited with code ${code}`));
            }
        });

        child.on('error', err => {
            reject(err);
        });
    });
}

export async function executeMcpOperation(
    commandName: string,
    options: Record<string, any>,
    projectPath: string,
): Promise<string> {
    try {
        if (commandName === 'add') {
            const result = await performAddOperation({ ...options, projectPath } as AddOperationOptions);

            if (result.success) {
                return result.message;
            } else {
                throw new Error(result.message);
            }
        } else {
            const cliArgs = [commandName, ...formatOptionsForCli(options)];
            const result = await executeVendureCommand(cliArgs, projectPath);
            return `${commandName} operation completed successfully.\n\nOutput:\n${result}`;
        }
    } catch (error) {
        throw new Error(
            `Failed to execute ${commandName}: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export function formatOptionsForCli(options: Record<string, any>): string[] {
    const args: string[] = [];

    for (const [key, value] of Object.entries(options)) {
        if (value === undefined || value === false) continue;

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
