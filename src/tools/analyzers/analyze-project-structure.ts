import fs from 'fs';
import path from 'path';

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
