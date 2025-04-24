/**
 * Checks if the current platform is Linux
 * @returns {boolean} True if running on Linux
 */
export function isLinux(): boolean {
    return process.platform === 'linux';
}