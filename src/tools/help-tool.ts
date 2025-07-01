export const helpGuides: Record<string, string> = {
    'api-extension': `
API EXTENSION GUIDE:

Required Parameters:
- apiExtension: "plugin-name" (must be existing plugin)
- selectedService: "ServiceName" (must be existing service in the plugin)
- queryName: "customQueryName" OR mutationName: "customMutationName" (at least one required)

Example:
{
  "apiExtension": "my-plugin",
  "queryName": "getCustomProducts", 
  "selectedService": "ProductService"
}

TIP: Use list_plugins tool first to see available plugins and services.`,

    entity: `
ENTITY GUIDE:

Required Parameters:
- entity: "EntityClassName" (PascalCase)
- selectedPlugin: "plugin-name" (must be existing plugin)

Optional Parameters:
- customFields: true (adds custom fields support)
- translatable: true (makes entity translatable)

Example:
{
  "entity": "CustomProduct",
  "selectedPlugin": "my-plugin",
  "customFields": true
}`,

    service: `
SERVICE GUIDE:

Required Parameters:
- service: "ServiceClassName" (PascalCase)
- selectedPlugin: "plugin-name" (must be existing plugin)

Optional Parameters:
- type: "basic" | "entity" (default: basic)
- selectedEntity: "EntityName" (auto-sets type to entity)

Example:
{
  "service": "CustomProductService",
  "selectedPlugin": "my-plugin",
  "type": "entity",
  "selectedEntity": "Product"
}`,

    plugin: `
PLUGIN GUIDE:

Required Parameters:
- plugin: "PluginName" (PascalCase)

Example:
{
  "plugin": "MyAwesomePlugin"
}`,

    'job-queue': `
📋 JOB QUEUE GUIDE:

Required Parameters:
- jobQueue: "plugin-name" (must be existing plugin)
- name: "queue-name" (kebab-case recommended)
- selectedService: "ServiceName" (must be existing service)

Example:
{
  "jobQueue": "my-plugin",
  "name": "email-sending-queue",
  "selectedService": "EmailService"
}`,
};

export function generateHelpContent(operation?: string): string {
    if (operation && operation !== 'all') {
        return helpGuides[operation] || `No guide available for operation: ${operation}`;
    }

    return `
VENDURE ADD TOOL COMPLETE GUIDE:

${Object.entries(helpGuides)
    .map(([_op, guide]) => guide)
    .join('\n\n')}

COMMON MISTAKES TO AVOID:
1. Using non-existent plugin names (use list_plugins first)
2. Missing required parameter combinations
3. Wrong casing (use PascalCase for class names, kebab-case for plugin names)
4. For API extensions: forgetting selectedService or query/mutation names

DISCOVERY TOOLS:
- list_plugins: See all available plugins and their services
- vendure_add_help: Get specific guidance for operations

NOTE: Project path is automatically determined from server context - no need to specify it!
`;
}
