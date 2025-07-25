// Type declarations for Web Serial API
export interface SerialPort {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<Uint8Array>;
    getInfo(): SerialPortInfo;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
}

export interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
}

export interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    bufferSize?: number;
    flowControl?: "none" | "hardware";
}

export interface Serial {
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}

export interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
}

export interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
}

// Extend Navigator interface
declare global {
    interface Navigator {
        serial: Serial;
    }
}
