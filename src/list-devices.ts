import { execSync } from 'child_process';
import glob from 'glob';
import { USBDevice, DeviceProperties } from './types';

const targetFields = new Set(Object.values(DeviceProperties));

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