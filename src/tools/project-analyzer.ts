import fs from 'fs';
import path from 'path';

/**
 * List all plugins in the Vendure project by analyzing the project structure
 */
export function listPlugins(projectPath: string): string {
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
}

/**
 * Analyze the overall structure of a Vendure project including entities, services, and configuration
 */
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

        // Analyze src directory structure
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
}

/**
 * Check if Vendure CLI is properly installed and what version is available in the project
 */
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
}
