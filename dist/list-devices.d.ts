import { USBDevice } from './types';
export declare function parseUdevadmOutput(output: string): USBDevice | null;
export declare function listDevices(): USBDevice[];
