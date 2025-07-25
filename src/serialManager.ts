import { SerialPort } from "./serial.js";
import { EventEmitter } from "./eventEmitter.js";
import {
    updateSerialState,
    addDataToHistory,
    resetSerialState,
} from "./serialState.js";

export class SerialManager extends EventEmitter {
    private currentPort: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private isReading = false;

    constructor() {
        super();
    }

    async requestAndConnect(): Promise<SerialPort> {
        if (this.currentPort) {
            throw new Error(
                "Já existe uma porta conectada. Desconecte primeiro."
            );
        }

        const port = await navigator.serial.requestPort();
        console.log("Porta selecionada:", port);

        // Abrir a porta
        await port.open({ baudRate: 9600 });
        console.log("Porta aberta com sucesso!");

        this.currentPort = port;

        // Atualizar estado global
        updateSerialState({
            isConnected: true,
            connectionTime: new Date(),
        });

        // Emitir evento de conexão
        this.emit("connected", port);

        // Iniciar leitura em background
        this.startReading();

        return port;
    }

    private async startReading(): Promise<void> {
        if (!this.currentPort || this.isReading) {
            return;
        }

        this.isReading = true;

        try {
            if (!this.currentPort.readable) {
                console.error("Porta não é legível");
                return;
            }

            this.reader = this.currentPort.readable.getReader();
            console.log("Iniciando leitura de dados...");

            while (this.isReading && this.currentPort) {
                const { value, done } = await this.reader.read();
                if (done) {
                    console.log("Leitura finalizada");
                    break;
                }

                const text = new TextDecoder().decode(value);
                addDataToHistory(text);
                this.emit("data", text);
            }
        } catch (error) {
            console.error("Erro durante a leitura:", error);
            this.emit("error", error);
        } finally {
            if (this.reader) {
                this.reader.releaseLock();
                this.reader = null;
            }
            this.isReading = false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            // Parar a leitura
            this.isReading = false;

            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }

            // Fechar a porta
            if (this.currentPort) {
                await this.currentPort.close();
                console.log("Porta desconectada");
                this.currentPort = null;
            }

            updateSerialState({ isConnected: false });

            this.emit("disconnected");
        } catch (error) {
            this.emit("error", error);
            console.error("Erro ao desconectar:", error);
            throw error;
        }
    }

    isConnected(): boolean {
        return this.currentPort !== null;
    }

    getCurrentPort(): SerialPort | null {
        return this.currentPort;
    }

    async getAuthorizedPorts(): Promise<SerialPort[]> {
        return await navigator.serial.getPorts();
    }

    getPortInfo(port: SerialPort): string {
        const info = port.getInfo();
        if (info.usbVendorId && info.usbProductId) {
            return `USB Device (Vendor: 0x${info.usbVendorId.toString(
                16
            )}, Product: 0x${info.usbProductId.toString(16)})`;
        }
        return "Porta Serial";
    }

    resetState(): void {
        resetSerialState();
    }
}
