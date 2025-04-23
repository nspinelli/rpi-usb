import { USBDevice, DeviceChangeCallback } from './types';
export declare class RPiUSB {
    private deviceChangeCallbacks;
    private isMonitoring;
    constructor();
    private initializeUSB;
    /**
     * List all connected USB devices
     */
    listDevices(): Promise<USBDevice[]>;
    /**
     * Start monitoring for USB device changes
     */
    startMonitoring(): void;
    /**
     * Stop monitoring for USB device changes
     */
    stopMonitoring(): void;
    /**
     * Register a callback for device change events
     */
    onDeviceChange(callback: DeviceChangeCallback): void;
    /**
     * Remove a device change callback
     */
    removeDeviceChangeCallback(callback: DeviceChangeCallback): void;
    private handleDeviceChange;
}
