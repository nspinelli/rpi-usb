import { USBDevice, DeviceChangeCallback, DeviceChangeEvent } from './types';

export class RPiUSB {
    private deviceChangeCallbacks: DeviceChangeCallback[] = [];
    private isMonitoring: boolean = false;

    constructor() {
        // Initialize USB monitoring
        this.initializeUSB();
    }

    private initializeUSB(): void {
        try {
            // Check if we're running on a Raspberry Pi
            if (process.platform !== 'linux') {
                throw new Error('This package is designed to run on Linux/Raspberry Pi only');
            }
        } catch (error) {
            console.error('Error initializing USB:', error);
            throw error;
        }
    }

    /**
     * List all connected USB devices
     */
    public async listDevices(): Promise<USBDevice[]> {
        try {
            const { exec } = require('child_process');

            return new Promise((resolve, reject) => {
                exec('lsusb -v', (error: Error | null, stdout: string, stderr: string) => {
                    if (error) {
                        reject(new Error(`Failed to list USB devices: ${error.message}`));
                        return;
                    }

                    if (stderr) {
                        reject(new Error(`Error listing USB devices: ${stderr}`));
                        return;
                    }

                    const devices: USBDevice[] = [];
                    const lines = stdout.split('\n');
                    let currentDevice: Partial<USBDevice> = {};

                    for (const line of lines) {
                        if (line.includes('Bus')) {
                            if (Object.keys(currentDevice).length > 0) {
                                devices.push(currentDevice as USBDevice);
                            }
                            const match = line.match(/Bus (\d+) Device (\d+): ID (\w+):(\w+)/);
                            if (match) {
                                currentDevice = {
                                    deviceAddress: parseInt(match[2], 10),
                                    vendorId: parseInt(match[3], 16),
                                    productId: parseInt(match[4], 16)
                                };
                            }
                        } else if (line.includes('iManufacturer')) {
                            currentDevice.manufacturer = line.split('iManufacturer')[1].trim();
                        } else if (line.includes('iProduct')) {
                            currentDevice.product = line.split('iProduct')[1].trim();
                        } else if (line.includes('iSerial')) {
                            currentDevice.serialNumber = line.split('iSerial')[1].trim();
                        }
                    }

                    if (Object.keys(currentDevice).length > 0) {
                        devices.push(currentDevice as USBDevice);
                    }

                    resolve(devices);
                });
            });
        } catch (error) {
            throw new Error(`Failed to list USB devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Start monitoring for USB device changes
     */
    public startMonitoring(): void {
        if (this.isMonitoring) {
            return;
        }

        try {
            const { exec } = require('child_process');

            // Start udevadm monitor in the background
            const monitor = exec('udevadm monitor --udev -s usb');

            monitor.stdout.on('data', (data: string) => {
                this.handleDeviceChange(data);
            });

            monitor.stderr.on('data', (data: string) => {
                console.error('Error monitoring USB devices:', data);
            });

            this.isMonitoring = true;
        } catch (error) {
            throw new Error(`Failed to start USB monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Stop monitoring for USB device changes
     */
    public stopMonitoring(): void {
        this.isMonitoring = false;
    }

    /**
     * Register a callback for device change events
     */
    public onDeviceChange(callback: DeviceChangeCallback): void {
        this.deviceChangeCallbacks.push(callback);
    }

    /**
     * Remove a device change callback
     */
    public removeDeviceChangeCallback(callback: DeviceChangeCallback): void {
        this.deviceChangeCallbacks = this.deviceChangeCallbacks.filter(cb => cb !== callback);
    }

    private async handleDeviceChange(data: string): Promise<void> {
        try {
            if (!data.includes('usb')) {
                return;
            }

            const type = data.includes('add') ? 'attach' : 'detach';
            const devices = await this.listDevices();

            // Find the most recently changed device
            const changedDevice = devices[devices.length - 1];

            if (changedDevice) {
                const event: DeviceChangeEvent = {
                    type,
                    device: changedDevice
                };

                this.deviceChangeCallbacks.forEach(callback => callback(event));
            }
        } catch (error) {
            console.error('Error handling device change:', error);
        }
    }
} 