import { parse } from 'dotenv';
import fs from 'fs';
import path from 'path';

const SUPPORTED_DB_TYPES = ['mysql', 'mariadb', 'postgres', 'sqlite'];

export function getDatabaseType(projectPath: string): string {
    const configPaths = [
        path.join(projectPath, 'src', 'vendure-config.ts'),
        path.join(projectPath, 'vendure-config.ts'),
    ];

    let configContent: string | undefined;

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            configContent = fs.readFileSync(configPath, 'utf-8');
            break;
        }
    }

    if (!configContent) {
        return 'Vendure config file not found.';
    }

    const dbTypeRegex = /type:\s*(?:['"]([^'"]+)['"]|(?:process\.env\.([a-zA-Z0-9_]+)))/;
    const dbTypeMatch = configContent.match(dbTypeRegex);

    if (!dbTypeMatch) {
        return 'Could not determine database type from config file.';
    }

    let dbType: string | undefined;

    if (dbTypeMatch[1]) {
        dbType = dbTypeMatch[1];
    } else if (dbTypeMatch[2]) {
        const envVarName = dbTypeMatch[2];
        const envPath = path.join(projectPath, '.env');

        if (!fs.existsSync(envPath)) {
            return `Database type is set by environment variable "${envVarName}", but .env file was not found.`;
        }

        const envContent = fs.readFileSync(envPath);
        const envVars = parse(envContent);
        dbType = envVars[envVarName];

        if (!dbType) {
            return `Database type is set by environment variable "${envVarName}", but it was not found in the .env file.`;
        }
    }

    if (dbType) {
        if (SUPPORTED_DB_TYPES.includes(dbType)) {
            const source = dbTypeMatch[1] ? 'config file' : '.env file';
            return `Database type: ${dbType} (from ${source})`;
        }
        return `Unsupported or unknown database type "${dbType}" found.`;
    }

    return 'Could not determine database type from config file.';
}
