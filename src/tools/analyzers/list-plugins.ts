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
