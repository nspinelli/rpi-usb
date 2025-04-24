"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLinux = isLinux;
/**
 * Checks if the current platform is Linux
 * @returns {boolean} True if running on Linux
 */
function isLinux() {
    return process.platform === 'linux';
}
