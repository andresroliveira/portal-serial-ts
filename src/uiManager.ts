export class UIManager {
    private connectBtn: HTMLButtonElement;
    private disconnectBtn: HTMLButtonElement;
    private dataOutput: HTMLTextAreaElement;

    constructor() {
        this.connectBtn = this.getElement("connectBtn") as HTMLButtonElement;
        this.disconnectBtn = this.getElement(
            "disconnectBtn"
        ) as HTMLButtonElement;
        this.dataOutput = this.getElement("dataOutput") as HTMLTextAreaElement;

        if (!this.connectBtn || !this.disconnectBtn) {
            throw new Error("Elementos do DOM não encontrados");
        }

        this.disconnectBtn.disabled = true;
    }

    private getElement(id: string): HTMLElement | null {
        return document.getElementById(id);
    }

    setConnectButtonClickHandler(handler: () => Promise<void>): void {
        this.connectBtn.addEventListener("click", handler);
    }

    setDisconnectButtonClickHandler(handler: () => Promise<void>): void {
        this.disconnectBtn.addEventListener("click", handler);
    }

    updateUIOnConnecting(): void {
        this.connectBtn.disabled = true;
        this.connectBtn.textContent = "Conectando...";
    }

    updateUIOnConnected(portLabel: string = "Conectado"): void {
        this.connectBtn.disabled = true;
        this.disconnectBtn.disabled = false;
        this.connectBtn.textContent = portLabel;
    }

    updateUIOnDisconnected(): void {
        this.connectBtn.disabled = false;
        this.disconnectBtn.disabled = true;
        this.connectBtn.textContent = "Conectar à Porta Serial";

        if (this.dataOutput) {
            this.dataOutput.value = "";
        }
    }

    updateUIOnError(): void {
        this.connectBtn.disabled = false;
        this.connectBtn.textContent = "Conectar à Porta Serial";
    }

    appendData(data: string): void {
        if (this.dataOutput) {
            this.dataOutput.value += data;
            this.dataOutput.scrollTop = this.dataOutput.scrollHeight;
        }
    }

    clearData(): void {
        if (this.dataOutput) {
            this.dataOutput.value = "";
        }
    }

    showError(message: string): void {
        console.error(message);
    }
}
