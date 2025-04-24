# RPi USB Monitor

A TypeScript library for monitoring USB devices on Linux systems, particularly optimized for Raspberry Pi. This package provides robust functionality to list and monitor USB devices using built-in Node.js packages and udev.

| Section | Description |
|---------|------------------------------------------------------------------- |
| [Features](#features) | Key features and capabilities |
| [Installation](#installation) | Setup and installation instructions |
| [Usage](#usage) | Detailed usage examples |
| [API Reference](#api-reference) | Complete API documentation |
| [Error Handling](#error-handling) | Error handling and logging |
| [Requirements](#requirements) | System requirements and dependencies |

## Features
- Real-time USB device monitoring using udev
- Automatic device detection and tracking
- Graceful shutdown handling
- TypeScript support with comprehensive types
- Event-based architecture
- Platform-specific checks (Linux only)
- Automatic cleanup on process termination

## Installation

```bash
npm install rpi-usb
```

## Usage

### Basic Setup

```typescript
import { USBDeviceMonitor } from 'rpi-usb';

// Create a monitor instance
const monitor = new USBDeviceMonitor();

// Start monitoring device changes
monitor.onDeviceChange((event) => {
    console.log(`Device ${event.type}ed:`, event.device);
});
```

### Device Listing

```typescript
import { listDevices } from 'rpi-usb';

// List all connected USB devices
const devices = listDevices();
console.log('Connected devices:', devices);
```

### Advanced Monitoring

```typescript
import { USBDeviceMonitor } from 'rpi-usb';

const monitor = new USBDeviceMonitor();

// Add multiple callbacks
monitor.onDeviceChange((event) => {
    if (event.type === 'attach') {
        console.log('New device attached:', event.device);
    } else {
        console.log('Device detached:', event.device);
    }
});

// Remove a callback when no longer needed
const callback = (event) => {
    console.log('Device change:', event);
};
monitor.onDeviceChange(callback);
monitor.removeDeviceChangeListener(callback);
```

## API Reference

### USBDeviceMonitor Class

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `onDeviceChange` | Register callback for device changes | `callback: (event: DeviceChangeEvent) => void` | `void` |
| `removeDeviceChangeListener` | Remove a registered callback | `callback: (event: DeviceChangeEvent) => void` | `void` |

### Types

```typescript
interface USBDevice {
    DEVPATH: string;
    DEVNAME: string;
    ID_VENDOR?: string;
    ID_MODEL?: string;
    ID_SERIAL?: string;
    ID_VENDOR_ID?: string;
    ID_MODEL_ID?: string;
}

interface DeviceChangeEvent {
    type: 'attach' | 'detach';
    device: USBDevice;
}
```

### Device Properties

The following table describes all available device properties that can be accessed from a USBDevice:

| Property | Description |
|----------|-------------|
| `DEVPATH` | Device path in the system |
| `DEVNAME` | Device name (e.g., /dev/ttyUSB0) |
| `MAJOR` | Major device number |
| `MINOR` | Minor device number |
| `SUBSYSTEM` | Device subsystem (e.g., tty, usb) |
| `USEC_INITIALIZED` | Time when device was initialized |
| `ID_BUS` | Bus type (e.g., usb) |
| `ID_MODEL` | Device model name |
| `ID_MODEL_ENC` | Encoded device model name |
| `ID_MODEL_ID` | Device model ID |
| `ID_SERIAL` | Device serial number |
| `ID_SERIAL_SHORT` | Shortened device serial number |
| `ID_VENDOR` | Device vendor name |
| `ID_VENDOR_ENC` | Encoded device vendor name |
| `ID_VENDOR_ID` | Device vendor ID |
| `ID_REVISION` | Device revision number |
| `ID_TYPE` | Device type |
| `ID_USB_MODEL` | USB-specific model name |
| `ID_USB_MODEL_ENC` | Encoded USB-specific model name |
| `ID_USB_MODEL_ID` | USB-specific model ID |
| `ID_USB_SERIAL` | USB-specific serial number |
| `ID_USB_SERIAL_SHORT` | Shortened USB-specific serial number |
| `ID_USB_VENDOR` | USB-specific vendor name |
| `ID_USB_VENDOR_ENC` | Encoded USB-specific vendor name |
| `ID_USB_VENDOR_ID` | USB-specific vendor ID |
| `ID_USB_REVISION` | USB-specific revision number |
| `ID_USB_TYPE` | USB-specific device type |
| `ID_USB_INTERFACES` | USB interface information |
| `ID_USB_INTERFACE_NUM` | USB interface number |
| `ID_USB_DRIVER` | USB driver name |
| `ID_VENDOR_FROM_DATABASE` | Vendor name from USB database |
| `ID_MODEL_FROM_DATABASE` | Model name from USB database |
| `ID_PATH` | Device path identifier |
| `ID_PATH_TAG` | Device path tag |
| `ID_MM_CANDIDATE` | ModemManager candidate flag |
| `SYSTEMD_WANTS` | Systemd service dependencies |
| `DEVLINKS` | Device symbolic links |
| `TAGS` | Device tags |
| `CURRENT_TAGS` | Current device tags |

## Error Handling

The library implements comprehensive error handling and logging. All errors are logged with timestamps and context information.

### Error Codes and Descriptions

| Error Code | Description | Solution | Level |
|------------|-------------|----------|-------|
| MONITOR_START_FAILED | Failed to start USB monitoring | Check system permissions and udev configuration | Error |
| MONITOR_STOP_FAILED | Failed to stop USB monitoring | Check process permissions | Warning |
| DEVICE_READ_ERROR | Failed to read device information | Verify device permissions and connection | Warning |
| CALLBACK_ERROR | Error in device change callback | Review callback implementation | Warning |

## Requirements

- Node.js 14 or higher
- Linux system (Raspberry Pi recommended)
- Root/sudo access for USB monitoring
- udev installed and configured
