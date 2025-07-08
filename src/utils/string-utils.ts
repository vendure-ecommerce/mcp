/**
 * Removes ANSI escape codes from a string.
 */
export function stripAnsi(str: string): string {
    // This regex is a common one for stripping ANSI escape codes.
    // It covers a wide range of escape sequences for colors, cursor movement, etc.
    // eslint-disable-next-line no-control-regex
    const ansiRegex = /[\u001b\u009b][[()#;?]*.{0,2}(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    return str.replace(ansiRegex, '');
}
