import { RPiUSB } from '../index';
import { exec, execSync, ExecException } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
jest.mock('child_process', () => ({
    exec: jest.fn(),
    execSync: jest.fn(),
}));

// Mock process.platform
jest.mock('process', () => ({
    platform: 'linux',
}));

describe('RPiUSB', () => {
    let usb: RPiUSB;
    const mockExec = require('child_process').exec as jest.MockedFunction<typeof exec>;
    const mockExecSync = require('child_process').execSync as jest.MockedFunction<typeof execSync>;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset platform to linux for each test
        Object.defineProperty(process, 'platform', { value: 'linux' });
        usb = new RPiUSB();
    });

    describe('constructor', () => {
        it('should initialize without errors', () => {
            expect(() => new RPiUSB()).not.toThrow();
        });

        it('should throw error on non-Linux platform', () => {
            Object.defineProperty(process, 'platform', { value: 'win32' });
            expect(() => new RPiUSB()).toThrow('This package is designed to run on Linux/Raspberry Pi only');
        });
    });

    describe('listDevices', () => {
        const mockLsusbOutput = `
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 001 Device 002: ID 0424:9514 Standard Microsystems Corp. 
Bus 001 Device 003: ID 0424:ec00 Standard Microsystems Corp. 
Bus 001 Device 004: ID 0bda:8179 Realtek Semiconductor Corp. RTL8188EUS 802.11n Wireless Network Adapter
`;

        it('should return list of USB devices', async () => {
            mockExecSync.mockReturnValue(mockLsusbOutput);

            const devices = await usb.listDevices();

            expect(devices).toHaveLength(5);
            expect(devices[0]).toEqual({
                vendorId: 0x1d6b,
                productId: 0x0002,
                deviceAddress: 1,
            });
            expect(mockExecSync).toHaveBeenCalledWith('lsusb -v');
        }, 10000); // Increased timeout for this test

        it('should handle lsusb command error', async () => {
            mockExecSync.mockImplementation(() => {
                throw new Error('lsusb command failed');
            });

            await expect(usb.listDevices()).rejects.toThrow('Failed to list USB devices: lsusb command failed');
        }, 10000); // Increased timeout for this test
    });

    describe('device monitoring', () => {
        let mockProcess: EventEmitter;

        beforeEach(() => {
            mockProcess = new EventEmitter();
            mockExec.mockImplementation((command: string, options: any, callback?: (error: ExecException | null, stdout: string, stderr: string) => void) => {
                if (callback) {
                    callback(null, '', '');
                }
                return mockProcess as any;
            });
        });

        it('should start monitoring', () => {
            usb.startMonitoring();
            expect(mockExec).toHaveBeenCalledWith('udevadm monitor --udev -s usb', expect.any(Function));
        });

        it('should not start monitoring if already monitoring', () => {
            usb.startMonitoring();
            usb.startMonitoring();
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it('should stop monitoring', () => {
            usb.startMonitoring();
            usb.stopMonitoring();
            expect(usb['isMonitoring']).toBe(false);
        });

        it('should handle device change events', async () => {
            const mockCallback = jest.fn();
            usb.onDeviceChange(mockCallback);
            usb.startMonitoring();

            // Simulate device attach
            mockProcess.emit('stdout', 'KERNEL[123.456] add      /devices/pci0000:00/0000:00:14.0/usb1/1-1 (usb)');

            // Wait for the event to be processed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockCallback).toHaveBeenCalled();
            const event = mockCallback.mock.calls[0][0];
            expect(event.type).toBe('attach');
            expect(event.device).toBeDefined();
        });

        it('should handle monitoring errors', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            mockExec.mockImplementation((command: string, options: any, callback?: (error: ExecException | null, stdout: string, stderr: string) => void) => {
                if (callback) {
                    callback(new Error('Monitoring failed'), '', '');
                }
                return mockProcess as any;
            });

            expect(() => usb.startMonitoring()).toThrow('Failed to start USB monitoring: Monitoring failed');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('callback management', () => {
        it('should add and remove device change callbacks', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            usb.onDeviceChange(callback1);
            usb.onDeviceChange(callback2);
            expect(usb['deviceChangeCallbacks']).toHaveLength(2);

            usb.removeDeviceChangeCallback(callback1);
            expect(usb['deviceChangeCallbacks']).toHaveLength(1);
            expect(usb['deviceChangeCallbacks'][0]).toBe(callback2);
        });
    });
}); 