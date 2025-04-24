import { execSync } from 'child_process';
import glob from 'glob';
import { USBDevice, DeviceProperties } from './types';

const targetFields = new Set(Object.values(DeviceProperties));

function processDevLinks(devLinks: string): string {
    if (!devLinks) return '';
    return devLinks
        .split(' ')
        .filter(link => !link.startsWith('/dev/serial'))
        .join(' ');
}

export function parseUdevadmOutput(output: string): USBDevice | null {
    const lines = output.split('\n');
    const result: Record<string, string> = {};

    for (const line of lines) {
        const match = line.match(/^E: (\w+)=([^\n\r]+)/);
        if (match) {
            const [, key, value] = match;
            if (targetFields.has(key as DeviceProperties)) {
                result[key as DeviceProperties] = value;
            }
        }
    }

    if (!result.DEVNAME) return null;

    // Process DEVLINKS if it exists
    if (result.DEVLINKS) {
        result.DEVLINKS = processDevLinks(result.DEVLINKS);
    }

    return Object.values(DeviceProperties).reduce((acc, key) => ({
        ...acc,
        [key]: result[key as DeviceProperties] || ''
    }), {} as USBDevice);
}

export function listDevices(): USBDevice[] {
    const devices = glob.sync('/dev/ttyUSB*').concat(glob.sync('/dev/ttyACM*'));
    const results: USBDevice[] = [];

    for (const device of devices) {
        try {
            const output = execSync(`udevadm info -q all -n ${device}`, { encoding: 'utf-8' });
            const parsed = parseUdevadmOutput(output);
            if (parsed) results.push(parsed);
        } catch {
            // Skip unreadable devices
        }
    }

    return results;
}