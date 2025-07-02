import fs from 'fs';
import path from 'path';

export function checkVendureInstallation(projectPath: string): string {
    try {
        const absoluteProjectPath = path.isAbsolute(projectPath)
            ? projectPath
            : path.resolve(process.cwd(), projectPath);

        if (!fs.existsSync(absoluteProjectPath)) {
            throw new Error(`Project directory does not exist: ${absoluteProjectPath}`);
        }

        const packageJsonPath = path.join(absoluteProjectPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return '`package.json` not found. This does not seem to be a valid Node.js project.';
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const requiredPackages = [
            '@vendure/core',
            '@vendure/common',
            '@vendure/admin-ui-plugin',
            '@vendure/email-plugin',
            '@vendure/asset-server-plugin',
        ];

        const missingPackages = requiredPackages.filter(pkg => !dependencies[pkg]);

        let result = `Vendure Installation Check in ${absoluteProjectPath}\n\n`;

        if (missingPackages.length > 0) {
            result += `Status: ❌ Missing core Vendure packages:\n`;
            missingPackages.forEach(pkg => (result += `  • ${pkg}\n`));
            result += '\nConsider running `npm install` or `yarn install`.\n';
            return result;
        }

        result += 'Status: ✅ All core Vendure packages seem to be installed.\n\n';

        const tsConfigPath = path.join(absoluteProjectPath, 'tsconfig.json');
        if (fs.existsSync(tsConfigPath)) {
            result += 'TypeScript: `tsconfig.json` found.\n';
        } else {
            result += 'TypeScript: `tsconfig.json` not found. This might not be a TypeScript project.\n';
        }

        try {
            const nodeVersion = process.version;
            result += `Node.js Version: ${nodeVersion}\n`;
        } catch (e) {
            result += 'Could not determine Node.js version.\n';
        }

        const cliPath = path.join(absoluteProjectPath, 'node_modules', '.bin', 'vendure');
        if (fs.existsSync(cliPath)) {
            result += 'Vendure CLI: Found and correctly located.\n';
        } else {
            result += 'Vendure CLI: Not found in `node_modules/.bin`. Is `@vendure/cli` installed?\n';
        }

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to check Vendure installation: ${errorMessage}`);
    }
}
