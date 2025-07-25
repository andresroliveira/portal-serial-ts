import { SerialManager } from "./serialManager.js";
import { UIManager } from "./uiManager.js";
import { getSerialState } from "./serialState.js";
import { SerialDataParser } from "./serialDataParser.js";
import { Devices } from "./devices.js";

export class AppController {
    private serialManager: SerialManager;
    private uiManager: UIManager;
    private dataParser: SerialDataParser;
    private devices: Devices[] = [];

    constructor() {
        console.log("AppController: Iniciando construtor");

        this.serialManager = new SerialManager();
        console.log("AppController: SerialManager criado");

        this.uiManager = new UIManager();
        console.log("AppController: UIManager criado");

        this.dataParser = new SerialDataParser((device: Devices) => {
            this.onNewDevice(device);
        });
        console.log("AppController: SerialDataParser criado");

        this.setupEventHandlers();
        console.log("AppController: Event handlers configurados");

        this.setupSerialEvents();
        console.log("AppController: Serial events configurados");
    }

    private setupSerialEvents(): void {
        this.serialManager.on("data", (data: string) => {
            // Passar dados brutos para o UI
            this.uiManager.appendData(data);

            // Processar devices
            const newDevices = this.dataParser.processData(data);

            // Adicionar cada device ao UI
            newDevices.forEach((device) => {
                this.uiManager.addDevice(device);
            });

            // Atualizar status do buffer
            const bufferStats = this.dataParser.getBufferStats();
            this.uiManager.updateBufferStatus(bufferStats);

            const currentState = getSerialState();
            // console.log("Estado atual:", currentState);
        });

        this.serialManager.on("connected", (port: any) => {
            console.log("Conectado na porta:", port);
            // Limpar devices anteriores
            this.devices = [];
            this.dataParser.clearBuffer();
        });

        this.serialManager.on("disconnected", () => {
            console.log("Desconectado");
            // Limpar devices ao desconectar
            this.devices = [];
            this.dataParser.clearBuffer();
        });

        this.serialManager.on("error", (error: any) => {
            console.error("Erro:", error);
            this.uiManager.showError("Erro na serial: " + error.message);
        });
    }

    // Método chamado quando um novo device é processado
    private onNewDevice(device: Devices): void {
        // console.log("Novo device processado:", device.toString());

        // Adicionar à lista de devices
        this.devices.push(device);

        // Manter apenas os últimos 50 devices
        if (this.devices.length > 50) {
            this.devices.shift();
        }

        // Aqui você pode adicionar sua lógica personalizada:
        this.processDevice(device);
    }

    private processDevice(device: Devices): void {
        this.saveDeviceData(device);

        // Log para debug (pode ser removido em produção)
        console.log(
            `Device processado: ${device.serieSlave} - Temp: ${device.te}°C, pH: ${device.ph}`
        );
    }

    // Salva dados do device
    private saveDeviceData(device: Devices): void {
        const savedDevices = JSON.parse(
            localStorage.getItem("devices_history") || "[]"
        );
        savedDevices.push({
            ...device,
            timestamp: Date.now(),
        });

        // Manter apenas os últimos 1000 registros
        if (savedDevices.length > 1000) {
            savedDevices.splice(0, savedDevices.length - 1000);
        }

        localStorage.setItem("devices_history", JSON.stringify(savedDevices));
    }

    private setupEventHandlers(): void {
        console.log("AppController: Configurando handlers de eventos");

        this.uiManager.setConnectButtonClickHandler(async () => {
            console.log("AppController: Handler de conectar chamado");
            await this.handleConnect();
        });

        this.uiManager.setDisconnectButtonClickHandler(async () => {
            console.log("AppController: Handler de desconectar chamado");
            await this.handleDisconnect();
        });

        navigator.serial.addEventListener("connect", (event) => {
            console.log("Dispositivo conectado:", event);
        });

        navigator.serial.addEventListener("disconnect", (event) => {
            console.log("Dispositivo desconectado:", event);
            if (this.serialManager.getCurrentPort() === event.target) {
                this.handleDisconnect();
            }
        });
    }

    private async handleConnect(): Promise<void> {
        try {
            this.uiManager.updateUIOnConnecting();

            const port = await this.serialManager.requestAndConnect();
            const portLabel = this.serialManager.getPortInfo(port);

            this.uiManager.updateUIOnConnected(portLabel);
        } catch (error) {
            this.uiManager.updateUIOnError();
            this.uiManager.showError(
                "Erro ao conectar: " + (error as Error).message
            );
        }
    }

    private async handleDisconnect(): Promise<void> {
        try {
            await this.serialManager.disconnect();
            this.uiManager.updateUIOnDisconnected();
        } catch (error) {
            this.uiManager.showError(
                "Erro ao desconectar: " + (error as Error).message
            );
        }
    }

    async initialize(): Promise<void> {
        try {
            const authorizedPorts =
                await this.serialManager.getAuthorizedPorts();
            console.log("Portas já autorizadas:", authorizedPorts.length);

            console.log("Aplicação inicializada com sucesso!");
        } catch (error) {
            this.uiManager.showError(
                "Erro ao verificar portas autorizadas: " +
                    (error as Error).message
            );
        }
    }
}
