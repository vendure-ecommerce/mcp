import {
    analyzeProjectStructure,
    checkVendureInstallation,
    getDatabaseType,
    listPlugins,
} from '../tools/analyzers/index.js';

export const analysisTasks = [
    {
        name: 'list_plugins',
        description: 'Lists all discovered plugins in the project.',
        handler: listPlugins,
    },
    {
        name: 'analyze_project_structure',
        description: 'Scans and analyzes the project folder structure.',
        handler: analyzeProjectStructure,
    },
    {
        name: 'check_vendure_installation',
        description: 'Checks if a Vendure project is correctly installed in the current directory.',
        handler: checkVendureInstallation,
    },
    {
        name: 'get_database_type',
        description: 'Checks what database the vendure project is using.',
        handler: getDatabaseType,
    },
] as const;
