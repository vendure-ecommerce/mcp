export function convertToParameterName(longOption: string): string {
    return longOption
        .replace(/^--/, '')
        .replace(/ .*$/, '')
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
