# RPi USB

A TypeScript library for working with USB devices on Raspberry Pi. This package provides functionality to list and monitor USB devices using only built-in Node.js packages.

## Features

- List all connected USB devices
- Monitor USB device changes (attach/detach)
- TypeScript support
- Built-in error handling
- Platform-specific checks (Linux/Raspberry Pi only)

## Installation

```bash
npm install rpi-usb
```

## Usage

```typescript
import { RPiUSB } from 'rpi-usb';

// Create an instance
const usb = new RPiUSB();

// List all connected USB devices
const devices = await usb.listDevices();
console.log('Connected devices:', devices);

// Monitor device changes
usb.onDeviceChange((event) => {
  console.log(`Device ${event.type}ed:`, event.device);
});

// Start monitoring
usb.startMonitoring();

// Stop monitoring when done
usb.stopMonitoring();
```

## API Reference

### RPiUSB Class

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `listDevices()` | Lists all connected USB devices | `Promise<USBDevice[]>` |
| `startMonitoring()` | Starts monitoring for USB device changes | `void` |
| `stopMonitoring()` | Stops monitoring for USB device changes | `void` |
| `onDeviceChange(callback)` | Registers a callback for device change events | `void` |
| `removeDeviceChangeCallback(callback)` | Removes a device change callback | `void` |

### Types

#### USBDevice

```typescript
interface USBDevice {
  vendorId: number;
  productId: number;
  deviceAddress: number;
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
}
```

#### DeviceChangeEvent

```typescript
interface DeviceChangeEvent {
  type: 'attach' | 'detach';
  device: USBDevice;
}
```

## Requirements

- Node.js 14 or higher
- Raspberry Pi or other Linux system
- Root/sudo access for USB monitoring

## License

ISC 