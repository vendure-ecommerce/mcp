import { parse } from 'dotenv';
import fs from 'fs';
import path from 'path';

export function listPlugins(projectPath: string): string {
    try {
        const absoluteProjectPath = path.isAbsolute(projectPath)
            ? projectPath
            : path.resolve(process.cwd(), projectPath);

        if (!fs.existsSync(absoluteProjectPath)) {
            throw new Error(`Project directory does not exist: ${absoluteProjectPath}`);
        }

        const plugins: string[] = [];

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

        const configPaths = [
            path.join(absoluteProjectPath, 'src', 'vendure-config.ts'),
            path.join(absoluteProjectPath, 'vendure-config.ts'),
            path.join(absoluteProjectPath, 'src', 'index.ts'),
        ];

        const importedPlugins: string[] = [];
        for (const configPath of configPaths) {
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                const pluginImports = content.match(/import.*Plugin.*from.*['"](.*)['"]/g) || [];
                importedPlugins.push(...pluginImports.map(imp => imp.trim()));
                break;
            }
        }

        let result = `Vendure Project: ${absoluteProjectPath}\n\n`;

        if (plugins.length > 0) {
            result += `Custom Plugins Found (${plugins.length}):\n`;
            plugins.forEach(plugin => (result += `  • ${plugin}\n`));
            result += '\n';
        } else {
            result += 'No custom plugins found in standard directories\n\n';
        }

        if (importedPlugins.length > 0) {
            result += `Plugin Imports in Config (${importedPlugins.length}):\n`;
            importedPlugins.forEach(imp => (result += `  • ${imp}\n`));
            result += '\n';
        }

        result += 'Tip: Use `vendure_add` with `plugin` parameter to create new plugins';

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to analyze project: ${errorMessage}`);
    }
}

export function analyzeProjectStructure(projectPath: string): string {
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

        const srcDir = path.join(absoluteProjectPath, 'src');
        if (fs.existsSync(srcDir)) {
            const analyzeDirectory = (dir: string, category: keyof typeof analysis, pattern: RegExp) => {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
                    files.forEach(file => {
                        if (file.isFile() && pattern.test(file.name)) {
                            const filePath = file.path ?? '';
                            analysis[category].push(path.relative(srcDir, path.join(filePath, file.name)));
                        }
                    });
                }
            };

            analyzeDirectory(srcDir, 'entities', /\.entity\.(ts|js)$/);
            analyzeDirectory(srcDir, 'services', /\.service\.(ts|js)$/);
            analyzeDirectory(srcDir, 'plugins', /\.plugin\.(ts|js)$/);
        }

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

        let result = `Project Structure Analysis: ${path.basename(absoluteProjectPath)}\n`;
        result += `Path: ${absoluteProjectPath}\n\n`;

        result += `Entities (${analysis.entities.length}):\n`;
        if (analysis.entities.length > 0) {
            analysis.entities.forEach(entity => (result += `  • ${entity}\n`));
        } else {
            result += '  No custom entities found\n';
        }
        result += '\n';

        result += `Services (${analysis.services.length}):\n`;
        if (analysis.services.length > 0) {
            analysis.services.forEach(service => (result += `  • ${service}\n`));
        } else {
            result += '  No custom services found\n';
        }
        result += '\n';

        result += `Plugins (${analysis.plugins.length}):\n`;
        if (analysis.plugins.length > 0) {
            analysis.plugins.forEach(plugin => (result += `  • ${plugin}\n`));
        } else {
            result += '  No custom plugins found\n';
        }
        result += '\n';

        result += `Migrations (${analysis.migrations.length}):\n`;
        if (analysis.migrations.length > 0) {
            analysis.migrations.slice(0, 5).forEach(migration => (result += `  • ${migration}\n`));
            if (analysis.migrations.length > 5) {
                result += `  ... and ${analysis.migrations.length - 5} more\n`;
            }
        } else {
            result += '  No migrations found\n';
        }
        result += '\n';

        result += `Config Files (${analysis.configFiles.length}):\n`;
        analysis.configFiles.forEach(config => (result += `  • ${config}\n`));

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to analyze project structure: ${errorMessage}`);
    }
}

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

export function checkVendureInstallation(projectPath: string): string {
    try {
        const absoluteProjectPath = path.isAbsolute(projectPath)
            ? projectPath
            : path.resolve(process.cwd(), projectPath);

        if (!fs.existsSync(absoluteProjectPath)) {
            throw new Error(`Project directory does not exist: ${absoluteProjectPath}`);
        }

        const vendureBin = path.join(absoluteProjectPath, 'node_modules', '.bin', 'vendure');
        const packageJsonPath = path.join(absoluteProjectPath, 'package.json');

        let result = `Vendure Installation Check: ${path.basename(absoluteProjectPath)}\n\n`;

        if (fs.existsSync(vendureBin)) {
            result += 'Vendure CLI binary found\n';
            result += `Location: ${vendureBin}\n`;
        } else {
            result += 'Vendure CLI binary not found\n';
            result += 'Install with: npm install @vendure/cli\n';
        }

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
                result += `\nVendure Dependencies (${vendureDeps.length}):\n`;
                vendureDeps.forEach(([name, version]) => {
                    const versionStr = String(version);
                    result += ` - ${name}: ${versionStr}\n`;
                });
            } else {
                result += '\nNo Vendure dependencies found in package.json\n';
            }

            result += '\nEnvironment:\n';
            if (allDeps.typescript) {
                const tsVersion = String(allDeps.typescript);
                result += ` - TypeScript: ${tsVersion}\n`;
            }
            if (allDeps['@types/node']) {
                const nodeTypesVersion = String(allDeps['@types/node']);
                result += ` - Node Types: ${nodeTypesVersion}\n`;
            }
            result += ` - Node.js: ${process.version}\n`;
        }

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to check installation: ${errorMessage}`);
    }
}
