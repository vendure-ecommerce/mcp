export const enhancedParameterDescriptions: Record<string, Record<string, string>> = {
    add: {
        plugin: 'Create a new plugin with the specified name. Example: "MyNewPlugin"',
        entity: 'Add a new entity with the specified class name. Example: "Product" or "Customer". Requires selectedPlugin to be specified.',
        selectedPlugin:
            'Name of the plugin to add the entity/service/api-extension to. Must be an existing plugin name. Example: "my-plugin" or "test-plugin"',
        service:
            'Add a new service with the specified class name. Example: "ProductService" or "OrderService". Requires selectedPlugin to be specified.',
        type: 'Type of service: "basic" or "entity" (default: basic). Use "entity" when working with database entities.',
        selectedEntity:
            'Name of the entity for entity service (automatically sets type to entity). Example: "Product"',
        jobQueue:
            'Add job-queue support to the specified plugin. Provide the plugin name. Example: "my-plugin"',
        name: 'Name for the job queue (required with jobQueue). Example: "email-queue" or "product-import-queue"',
        selectedService:
            'Name of the service to add the job queue or API extension to. Must be an existing service. Example: "ProductService"',
        codegen:
            'Add GraphQL codegen configuration to the specified plugin. Provide the plugin name. Example: "my-plugin"',
        apiExtension:
            'Add an API extension scaffold to the specified plugin. Provide the plugin name. Example: "my-plugin". Requires queryName or mutationName and selectedService.',
        queryName:
            'Name for the GraphQL query (used with apiExtension). Example: "customProducts" or "getSpecialOffers"',
        mutationName:
            'Name for the GraphQL mutation (used with apiExtension). Example: "createCustomOrder" or "updateSpecialPrice"',
        uiExtensions:
            'Add Admin UI extensions setup to the specified plugin. Provide the plugin name. Example: "my-plugin"',
        customFields: 'Add custom fields support to the entity (boolean flag)',
        translatable: 'Make the entity translatable (boolean flag)',
        config: 'Specify the path to a custom Vendure config file. Example: "./custom-vendure-config.ts"',
    },
};

export const enhancedCommandDescriptions: Record<string, string> = {
    add: `Add features to your Vendure project. 

IMPORTANT USAGE PATTERNS:
- For API Extension: Requires apiExtension="plugin-name", plus queryName OR mutationName, plus selectedService
- For Entity: Requires entity="EntityName" and selectedPlugin="plugin-name"  
- For Service: Requires service="ServiceName" and selectedPlugin="plugin-name"
- For Job Queue: Requires jobQueue="plugin-name", name="queue-name", and selectedService="service-name"

EXAMPLES:
- Add API extension: {apiExtension: "my-plugin", queryName: "customProducts", selectedService: "ProductService"}
- Add entity: {entity: "CustomProduct", selectedPlugin: "my-plugin"}
- Add service: {service: "CustomService", selectedPlugin: "my-plugin"}
- Create new plugin: {plugin: "MyNewPlugin"}

Use list_plugins tool first to see available plugin names.`,
};
