import { USBDevice, DeviceChangeEvent, DeviceChangeCallback } from './types';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { listDevices } from './list-devices';

export class USBDeviceMonitor extends EventEmitter {
    private isMonitoring: boolean = false;
    private callbacks: DeviceChangeCallback[] = [];
    private currentDevices: Map<string, USBDevice> = new Map();
    private udevMonitor: ReturnType<typeof spawn> | null = null;

    constructor() {
        super();
        this.setupShutdownHandlers();
    }

    private setupShutdownHandlers(): void {
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            this.gracefulShutdown('uncaughtException');
        });
    }

    private async gracefulShutdown(signal: string): Promise<void> {
        try {
            if (this.isMonitoring) {
                await this.stopMonitoring();
            }
            console.log(`[RPI-USB][${new Date().toISOString()}] Graceful shutdown completed for ${signal}`);
        } catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Error during ${signal} shutdown: ${error}`);
        } finally {
            this.removeAllListeners();
            this.callbacks = [];
            if (this.udevMonitor) {
                this.udevMonitor.kill();
            }
            process.exit(0);
        }
    }

    private getDeviceKey(device: USBDevice): string {
        // Use the full device path as the unique identifier
        return device.DEVPATH;
    }

    private async startMonitoring(): Promise<void> {
        if (this.isMonitoring) return;

        try {
            // Initialize current devices
            console.log(`[RPI-USB][${new Date().toISOString()}] Monitoring devices...`);
            const devices = listDevices();
            console.log(`[RPI-USB][${new Date().toISOString()}] Found ${devices.length} devices`);
            this.currentDevices = new Map(
                devices.map(device => [this.getDeviceKey(device), device])
            );

            // Start udev monitor
            this.udevMonitor = spawn('stdbuf', [
                '-oL',
                'udevadm',
                'monitor',
                '--udev',
                '--subsystem-match=tty',
                '--subsystem-match=usb'
            ]);

            const udevMonitor = this.udevMonitor;
            if (udevMonitor?.stdout && udevMonitor?.stderr) {
                udevMonitor.stdout.on('data', (data: Buffer) => {
                    const event = data.toString().trim();
                    this.handleUdevEvent(event);
                });

                udevMonitor.stderr.on('data', (data: Buffer) => {
                    console.error(`[RPI-USB][${new Date().toISOString()}] Udev monitor error: ${data.toString()}`);
                });

                udevMonitor.on('close', (code: number) => {
                    if (code !== 0 && this.isMonitoring) {
                        console.error(`[RPI-USB][${new Date().toISOString()}] Udev monitor closed unexpectedly`);
                        this.restartMonitoring();
                    }
                });
            }

            this.isMonitoring = true;

        } catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Failed to start USB monitoring: ${error}`);
            throw error;
        }
    }

    private async handleUdevEvent(event: string): Promise<void> {
        // Match both USB and TTY events
        const match = event.match(/^UDEV\s+\[\d+\.\d+\]\s+(add|remove)\s+(.*)/);
        if (!match) return;

        const [, action, devicePath] = match;

        // Give the system a moment to settle after the udev event
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get updated device list
        const currentDevices = listDevices();

        if (action === 'add') {
            // Look for new devices by comparing paths
            for (const newDevice of currentDevices) {
                const deviceKey = this.getDeviceKey(newDevice);
                if (!this.currentDevices.has(deviceKey)) {
                    this.currentDevices.set(deviceKey, newDevice);
                    this.notifyCallbacks({
                        type: 'attach',
                        device: newDevice
                    });
                }
            }
        } else if (action === 'remove') {
            // Check for removed devices
            const currentDeviceKeys = new Set(
                currentDevices.map(device => this.getDeviceKey(device))
            );

            for (const [deviceKey, device] of this.currentDevices) {
                if (!currentDeviceKeys.has(deviceKey)) {
                    this.currentDevices.delete(deviceKey);
                    this.notifyCallbacks({
                        type: 'detach',
                        device: device
                    });
                }
            }
        }
    }

    private async restartMonitoring(): Promise<void> {
        try {
            await this.stopMonitoring();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.startMonitoring();
        } catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Failed to restart monitoring: ${error}`);
        }
    }

    private async stopMonitoring(): Promise<void> {
        if (!this.isMonitoring) return;

        try {
            if (this.udevMonitor) {
                this.udevMonitor.kill();
                this.udevMonitor = null;
            }
            this.isMonitoring = false;
            this.currentDevices.clear();
            console.log('')
            console.log(`[RPI-USB][${new Date().toISOString()}] USB device monitoring stopped`);
        } catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Failed to stop USB monitoring: ${error}`);
            throw error;
        }
    }

    public onDeviceChange(callback: DeviceChangeCallback): void {
        this.callbacks.push(callback);

        // Start monitoring if this is the first callback
        if (this.callbacks.length === 1) {
            this.startMonitoring().catch(error => {
                console.error(`[RPI-USB][${new Date().toISOString()}] Failed to start monitoring: ${error}`);
                process.exit(1);
            });
        }
    }

    public removeDeviceChangeListener(callback: DeviceChangeCallback): void {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);

        // Stop monitoring if no more callbacks
        if (this.callbacks.length === 0) {
            this.stopMonitoring().catch(error => {
                console.error(`[RPI-USB][${new Date().toISOString()}] Failed to stop monitoring: ${error}`);
            });
        }
    }

    private notifyCallbacks(event: DeviceChangeEvent): void {
        this.callbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error(`[RPI-USB][${new Date().toISOString()}] Error in device change callback: ${error}`);
            }
        });
    }
}

// Create and export the monitor instance
const monitor = new USBDeviceMonitor();
export default monitor;