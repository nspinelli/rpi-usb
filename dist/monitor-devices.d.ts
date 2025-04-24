import { DeviceChangeCallback } from './types';
import { EventEmitter } from 'events';
export declare class USBDeviceMonitor extends EventEmitter {
    private isMonitoring;
    private callbacks;
    private currentDevices;
    private udevMonitor;
    constructor();
    private setupShutdownHandlers;
    private gracefulShutdown;
    private getDeviceKey;
    private startMonitoring;
    private handleUdevEvent;
    private restartMonitoring;
    private stopMonitoring;
    onDeviceChange(callback: DeviceChangeCallback): void;
    removeDeviceChangeListener(callback: DeviceChangeCallback): void;
    private notifyCallbacks;
}
declare const monitor: USBDeviceMonitor;
export default monitor;
