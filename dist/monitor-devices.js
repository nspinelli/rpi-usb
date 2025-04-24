"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USBDeviceMonitor = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const list_devices_1 = require("./list-devices");
class USBDeviceMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.isMonitoring = false;
        this.callbacks = [];
        this.currentDevices = new Map();
        this.udevMonitor = null;
        this.setupShutdownHandlers();
    }
    setupShutdownHandlers() {
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            this.gracefulShutdown('uncaughtException');
        });
    }
    async gracefulShutdown(signal) {
        try {
            if (this.isMonitoring) {
                await this.stopMonitoring();
            }
            console.log(`[RPI-USB][${new Date().toISOString()}] Graceful shutdown completed for ${signal}`);
        }
        catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Error during ${signal} shutdown: ${error}`);
        }
        finally {
            this.removeAllListeners();
            this.callbacks = [];
            if (this.udevMonitor) {
                this.udevMonitor.kill();
            }
            process.exit(0);
        }
    }
    getDeviceKey(device) {
        // Use the full device path as the unique identifier
        return device.DEVPATH;
    }
    async startMonitoring() {
        if (this.isMonitoring)
            return;
        try {
            // Initialize current devices
            console.log(`[RPI-USB][${new Date().toISOString()}] Monitoring devices...`);
            const devices = (0, list_devices_1.listDevices)();
            console.log(`[RPI-USB][${new Date().toISOString()}] Found ${devices.length} devices`);
            this.currentDevices = new Map(devices.map(device => [this.getDeviceKey(device), device]));
            // Start udev monitor
            this.udevMonitor = (0, child_process_1.spawn)('stdbuf', [
                '-oL',
                'udevadm',
                'monitor',
                '--udev',
                '--subsystem-match=tty',
                '--subsystem-match=usb'
            ]);
            const udevMonitor = this.udevMonitor;
            if (udevMonitor?.stdout && udevMonitor?.stderr) {
                udevMonitor.stdout.on('data', (data) => {
                    const event = data.toString().trim();
                    this.handleUdevEvent(event);
                });
                udevMonitor.stderr.on('data', (data) => {
                    console.error(`[RPI-USB][${new Date().toISOString()}] Udev monitor error: ${data.toString()}`);
                });
                udevMonitor.on('close', (code) => {
                    if (code !== 0 && this.isMonitoring) {
                        console.error(`[RPI-USB][${new Date().toISOString()}] Udev monitor closed unexpectedly`);
                        this.restartMonitoring();
                    }
                });
            }
            this.isMonitoring = true;
        }
        catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Failed to start USB monitoring: ${error}`);
            throw error;
        }
    }
    async handleUdevEvent(event) {
        // Match both USB and TTY events
        const match = event.match(/^UDEV\s+\[\d+\.\d+\]\s+(add|remove)\s+(.*)/);
        if (!match)
            return;
        const [, action, devicePath] = match;
        // Give the system a moment to settle after the udev event
        await new Promise(resolve => setTimeout(resolve, 100));
        // Get updated device list
        const currentDevices = (0, list_devices_1.listDevices)();
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
        }
        else if (action === 'remove') {
            // Check for removed devices
            const currentDeviceKeys = new Set(currentDevices.map(device => this.getDeviceKey(device)));
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
    async restartMonitoring() {
        try {
            await this.stopMonitoring();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.startMonitoring();
        }
        catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Failed to restart monitoring: ${error}`);
        }
    }
    async stopMonitoring() {
        if (!this.isMonitoring)
            return;
        try {
            if (this.udevMonitor) {
                this.udevMonitor.kill();
                this.udevMonitor = null;
            }
            this.isMonitoring = false;
            this.currentDevices.clear();
            console.log('');
            console.log(`[RPI-USB][${new Date().toISOString()}] USB device monitoring stopped`);
        }
        catch (error) {
            console.error(`[RPI-USB][${new Date().toISOString()}] Failed to stop USB monitoring: ${error}`);
            throw error;
        }
    }
    onDeviceChange(callback) {
        this.callbacks.push(callback);
        // Start monitoring if this is the first callback
        if (this.callbacks.length === 1) {
            this.startMonitoring().catch(error => {
                console.error(`[RPI-USB][${new Date().toISOString()}] Failed to start monitoring: ${error}`);
                process.exit(1);
            });
        }
    }
    removeDeviceChangeListener(callback) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
        // Stop monitoring if no more callbacks
        if (this.callbacks.length === 0) {
            this.stopMonitoring().catch(error => {
                console.error(`[RPI-USB][${new Date().toISOString()}] Failed to stop monitoring: ${error}`);
            });
        }
    }
    notifyCallbacks(event) {
        this.callbacks.forEach(callback => {
            try {
                callback(event);
            }
            catch (error) {
                console.error(`[RPI-USB][${new Date().toISOString()}] Error in device change callback: ${error}`);
            }
        });
    }
}
exports.USBDeviceMonitor = USBDeviceMonitor;
// Create and export the monitor instance
const monitor = new USBDeviceMonitor();
exports.default = monitor;
