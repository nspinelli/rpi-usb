export interface USBDevice {
    vendorId: number;
    productId: number;
    deviceAddress: number;
    manufacturer?: string;
    product?: string;
    serialNumber?: string;
}
export interface DeviceChangeEvent {
    type: 'attach' | 'detach';
    device: USBDevice;
}
export type DeviceChangeCallback = (event: DeviceChangeEvent) => void;
