"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUdevadmOutput = parseUdevadmOutput;
exports.listDevices = listDevices;
const child_process_1 = require("child_process");
const glob_1 = __importDefault(require("glob"));
const types_1 = require("./types");
const targetFields = new Set(Object.values(types_1.DeviceProperties));
function processDevLinks(devLinks) {
    if (!devLinks)
        return '';
    return devLinks
        .split(' ')
        .filter(link => !link.startsWith('/dev/serial'))
        .join(' ');
}
function parseUdevadmOutput(output) {
    const lines = output.split('\n');
    const result = {};
    for (const line of lines) {
        const match = line.match(/^E: (\w+)=([^\n\r]+)/);
        if (match) {
            const [, key, value] = match;
            if (targetFields.has(key)) {
                result[key] = value;
            }
        }
    }
    if (!result.DEVNAME)
        return null;
    // Process DEVLINKS if it exists
    if (result.DEVLINKS) {
        result.DEVLINKS = processDevLinks(result.DEVLINKS);
    }
    return Object.values(types_1.DeviceProperties).reduce((acc, key) => ({
        ...acc,
        [key]: result[key] || ''
    }), {});
}
function listDevices() {
    const devices = glob_1.default.sync('/dev/ttyUSB*').concat(glob_1.default.sync('/dev/ttyACM*'));
    const results = [];
    for (const device of devices) {
        try {
            const output = (0, child_process_1.execSync)(`udevadm info -q all -n ${device}`, { encoding: 'utf-8' });
            const parsed = parseUdevadmOutput(output);
            if (parsed)
                results.push(parsed);
        }
        catch {
            // Skip unreadable devices
        }
    }
    return results;
}
