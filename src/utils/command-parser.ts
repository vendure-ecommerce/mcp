export function convertToParameterName(longOption: string): string {
    return longOption
        .replace(/^--/, '')
        .replace(/ .*$/, '')
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function convertCamelToSnakeCase(camelStr: string): string {
    return camelStr.replace(/([A-Z])/g, '_$1').toLowerCase();
}
