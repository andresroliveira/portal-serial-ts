import { SerialManager } from "./serialManager.js";
import { UIManager } from "./uiManager.js";
import { getSerialState } from "./serialState.js";

export class AppController {
    private serialManager: SerialManager;
    private uiManager: UIManager;

    constructor() {
        this.serialManager = new SerialManager();
        this.uiManager = new UIManager();

        this.setupEventHandlers();
        this.setupSerialEvents();
    }

    private setupSerialEvents(): void {
        this.serialManager.on("data", (data: string) => {
            console.log("Dados: ", data);

            this.uiManager.appendData(data);

            const currentState = getSerialState();
            console.log("Estado atual:", currentState);
        });

        this.serialManager.on("connected", (port: any) => {
            console.log("Conectado na porta :", port);
        });

        this.serialManager.on("disconnected", () => {
            console.log("Desconectado");
        });

        this.serialManager.on("error", (error: any) => {
            this.uiManager.showError("Erro na serial: " + error.message);
        });
    }

    private setupEventHandlers(): void {
        this.uiManager.setConnectButtonClickHandler(async () => {
            await this.handleConnect();
        });

        this.uiManager.setDisconnectButtonClickHandler(async () => {
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
