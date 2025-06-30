/**
 * Help guide content for the vendure_add_help tool
 */

export const helpGuides: Record<string, string> = {
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

    entity: `
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

    service: `
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

    plugin: `
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
}`,
};

/**
 * Generate help content based on the requested operation
 */
export function generateHelpContent(operation?: string): string {
    if (operation && operation !== 'all') {
        return helpGuides[operation] || `No guide available for operation: ${operation}`;
    }

    return `
🔧 VENDURE ADD TOOL COMPLETE GUIDE:

${Object.entries(helpGuides)
    .map(([_op, guide]) => guide)
    .join('\n\n')}

⚠️  COMMON MISTAKES TO AVOID:
1. Using non-existent plugin names (use list_plugins first)
2. Missing required parameter combinations
3. Wrong casing (use PascalCase for class names, kebab-case for plugin names)
4. For API extensions: forgetting selectedService or query/mutation names

🔍 DISCOVERY TOOLS:
- list_plugins: See all available plugins and their services
- vendure_add_help: Get specific guidance for operations
`;
}
