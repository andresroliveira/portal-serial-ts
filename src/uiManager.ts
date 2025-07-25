import { Devices } from "./devices.js";

// Interfaces
interface AlertSettings {
    tempMax: number;
    phMin: number;
    phMax: number;
}

interface UISettings {
    theme: "dark" | "light";
    autoScroll: boolean;
    maxBufferSize: number;
    bufferTimeout: number;
    suppressedAlerts: string[];
}

interface ToastNotification {
    id: string;
    type: "success" | "warning" | "error" | "info";
    title: string;
    message: string;
    duration?: number;
}

interface ChartDataset {
    labels: string[];
    data: number[];
}

export class UIManager {
    private connectBtn: HTMLButtonElement;
    private disconnectBtn: HTMLButtonElement;
    private connectionStatus: HTMLElement;
    private dataOutput: HTMLTextAreaElement;

    // Dashboard elements
    private totalDevicesElement: HTMLElement;
    private totalDataElement: HTMLElement;
    private sessionTimeElement: HTMLElement;
    private dataRateElement: HTMLElement;
    private bufferSizeElement: HTMLElement;
    private bufferHealthElement: HTMLElement;
    private recentDevicesGrid: HTMLElement;
    private devicesTableBody: HTMLElement;

    // Chart instances
    private tempChart: any = null;
    private phChart: any = null;
    private temperatureChart: any = null;
    private pHChart: any = null;
    private pressureChart: any = null;
    private rpmChart: any = null;

    // Data tracking
    private devices: Devices[] = [];
    private sessionStartTime: number = Date.now();
    private totalBytesReceived: number = 0;
    private settings: UISettings;
    private alertSettings: AlertSettings;

    // Chart data
    private chartData: {
        temperature: ChartDataset;
        ph: ChartDataset;
        pressure: ChartDataset;
        rpm: ChartDataset;
    } = {
        temperature: { labels: [], data: [] },
        ph: { labels: [], data: [] },
        pressure: { labels: [], data: [] },
        rpm: { labels: [], data: [] },
    };

    constructor() {
        console.log("UIManager: Iniciando construtor");

        this.connectBtn = this.getElement("connectBtn") as HTMLButtonElement;
        this.disconnectBtn = this.getElement(
            "disconnectBtn"
        ) as HTMLButtonElement;

        console.log("UIManager: connectBtn encontrado:", !!this.connectBtn);
        console.log(
            "UIManager: disconnectBtn encontrado:",
            !!this.disconnectBtn
        );

        this.connectionStatus = this.getElement(
            "connectionStatus"
        ) as HTMLElement;
        this.dataOutput = this.getElement("dataOutput") as HTMLTextAreaElement;

        // Dashboard elements
        this.totalDevicesElement = this.getElement(
            "totalDevices"
        ) as HTMLElement;
        this.totalDataElement = this.getElement("totalData") as HTMLElement;
        this.sessionTimeElement = this.getElement("sessionTime") as HTMLElement;
        this.dataRateElement = this.getElement("dataRate") as HTMLElement;
        this.bufferSizeElement = this.getElement("bufferSize") as HTMLElement;
        this.bufferHealthElement = this.getElement(
            "bufferHealth"
        ) as HTMLElement;
        this.recentDevicesGrid = this.getElement(
            "recentDevicesGrid"
        ) as HTMLElement;
        this.devicesTableBody = this.getElement(
            "devicesTableBody"
        ) as HTMLElement;

        if (!this.connectBtn || !this.disconnectBtn) {
            console.error("UIManager: Elementos essenciais não encontrados!");
            console.error("connectBtn:", this.connectBtn);
            console.error("disconnectBtn:", this.disconnectBtn);
            throw new Error("Elementos essenciais do DOM não encontrados");
        }

        console.log("UIManager: Elementos encontrados com sucesso!");

        // Load settings
        this.settings = this.loadSettings();
        this.alertSettings = this.loadAlertSettings();

        this.initializeUI();
        this.setupNavigation();
        this.setupCharts();
        this.setupSettingsHandlers();
        this.startPeriodicUpdates();

        // Apply theme
        this.applyTheme(this.settings.theme);
    }

    private getElement(id: string): HTMLElement | null {
        return document.getElementById(id);
    }

    private initializeUI(): void {
        this.updateUIOnDisconnected();
        this.updateStats();

        // Setup clear data button
        const clearDataBtn = this.getElement("clearDataBtn");
        if (clearDataBtn) {
            clearDataBtn.addEventListener("click", () => this.clearData());
        }

        // Setup export data button
        const exportDataBtn = this.getElement("exportDataBtn");
        if (exportDataBtn) {
            exportDataBtn.addEventListener("click", () => this.exportData());
        }

        // Setup clear buffer button
        const clearBufferBtn = this.getElement("clearBufferBtn");
        if (clearBufferBtn) {
            clearBufferBtn.addEventListener("click", () => this.clearBuffer());
        }
    }

    private setupNavigation(): void {
        const navItems = document.querySelectorAll(".nav-item");
        const views = document.querySelectorAll(".view");

        navItems.forEach((item) => {
            item.addEventListener("click", () => {
                const viewName = item.getAttribute("data-view");

                // Remove active from all nav items and views
                navItems.forEach((nav) => nav.classList.remove("active"));
                views.forEach((view) => {
                    view.classList.remove("active");
                    view.classList.remove("fade-in");
                });

                // Add active to clicked nav item
                item.classList.add("active");

                // Show target view
                const targetView = document.getElementById(`${viewName}View`);
                if (targetView) {
                    targetView.classList.add("active");
                    targetView.classList.add("fade-in");
                }
            });
        });
    }

    private setupCharts(): void {
        // Setup Chart.js with dark theme
        if (typeof window !== "undefined" && (window as any).Chart) {
            const Chart = (window as any).Chart;
            Chart.defaults.backgroundColor = "rgba(59, 130, 246, 0.2)";
            Chart.defaults.borderColor = "#3b82f6";
            Chart.defaults.color = "#cbd5e1";
            Chart.defaults.font.family = "Inter";

            this.initializeCharts();
        }
    }

    private initializeCharts(): void {
        const Chart = (window as any).Chart;
        if (!Chart) {
            console.error("Chart.js não foi carregado!");
            return;
        }

        console.log("Inicializando gráficos...");

        // Common chart options with better Y-axis configuration
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index",
            },
            scales: {
                x: {
                    grid: { color: "#334155" },
                    ticks: {
                        color: "#cbd5e1",
                        maxTicksLimit: 10,
                    },
                    display: true,
                },
                y: {
                    grid: { color: "#334155" },
                    ticks: {
                        color: "#cbd5e1",
                        maxTicksLimit: 8,
                    },
                    display: true,
                    beginAtZero: true,
                    grace: "0%",
                },
            },
            plugins: {
                legend: {
                    labels: { color: "#cbd5e1" },
                    display: true,
                },
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 6,
                },
            },
            animation: {
                duration: 300,
                easing: "easeInOutQuart",
            },
        };

        // Create specific options for different chart types
        const tempOptions = {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    beginAtZero: true,
                    min: 0,
                    max: 50,
                    grace: "0%",
                    title: {
                        display: true,
                        text: "Temperatura (°C)",
                        color: "#cbd5e1",
                    },
                },
            },
        };

        const phOptions = {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    beginAtZero: true,
                    min: 0,
                    max: 14,
                    grace: "0%",
                    title: {
                        display: true,
                        text: "pH",
                        color: "#cbd5e1",
                    },
                },
            },
        };

        const pressureOptions = {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    beginAtZero: true,
                    min: 0,
                    grace: "10%",
                    title: {
                        display: true,
                        text: "Pressão",
                        color: "#cbd5e1",
                    },
                },
            },
        };

        const rpmOptions = {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    beginAtZero: true,
                    min: 0,
                    grace: "10%",
                    title: {
                        display: true,
                        text: "RPM",
                        color: "#cbd5e1",
                    },
                },
            },
        };

        // Quick charts
        const tempCtx = this.getElement("tempChart") as HTMLCanvasElement;
        if (tempCtx) {
            console.log("Criando gráfico de temperatura quick...");
            this.tempChart = new Chart(tempCtx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "Temperatura (°C)",
                            data: [],
                            borderColor: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            tension: 0.4,
                            fill: false,
                        },
                    ],
                },
                options: tempOptions,
            });
            console.log("Gráfico tempChart criado com sucesso");
        } else {
            console.error("Elemento tempChart não encontrado!");
        }

        const phCtx = this.getElement("phChart") as HTMLCanvasElement;
        if (phCtx) {
            console.log("Criando gráfico de pH quick...");
            this.phChart = new Chart(phCtx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "pH",
                            data: [],
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            tension: 0.4,
                            fill: false,
                        },
                    ],
                },
                options: phOptions,
            });
            console.log("Gráfico phChart criado com sucesso");
        } else {
            console.error("Elemento phChart não encontrado!");
        }

        // Detailed charts
        const tempDetailCtx = this.getElement(
            "temperatureChart"
        ) as HTMLCanvasElement;
        if (tempDetailCtx) {
            console.log("Criando gráfico de temperatura detalhado...");
            this.temperatureChart = new Chart(tempDetailCtx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "Temperatura (°C)",
                            data: [],
                            borderColor: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            tension: 0.4,
                            fill: false,
                        },
                    ],
                },
                options: tempOptions,
            });
            console.log("Gráfico temperatureChart criado com sucesso");
        } else {
            console.error("Elemento temperatureChart não encontrado!");
        }

        const phDetailCtx = this.getElement("pHChart") as HTMLCanvasElement;
        if (phDetailCtx) {
            console.log("Criando gráfico de pH detalhado...");
            this.pHChart = new Chart(phDetailCtx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "pH",
                            data: [],
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            tension: 0.4,
                            fill: false,
                        },
                    ],
                },
                options: phOptions,
            });
            console.log("Gráfico pHChart criado com sucesso");
        } else {
            console.error("Elemento pHChart não encontrado!");
        }

        const pressureCtx = this.getElement(
            "pressureChart"
        ) as HTMLCanvasElement;
        if (pressureCtx) {
            console.log("Criando gráfico de pressão...");
            this.pressureChart = new Chart(pressureCtx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "Pressão",
                            data: [],
                            borderColor: "#f59e0b",
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            tension: 0.4,
                            fill: false,
                        },
                    ],
                },
                options: pressureOptions,
            });
            console.log("Gráfico pressureChart criado com sucesso");
        } else {
            console.error("Elemento pressureChart não encontrado!");
        }

        const rpmCtx = this.getElement("rpmChart") as HTMLCanvasElement;
        if (rpmCtx) {
            console.log("Criando gráfico de RPM...");
            this.rpmChart = new Chart(rpmCtx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "RPM",
                            data: [],
                            borderColor: "#06b6d4",
                            backgroundColor: "rgba(6, 182, 212, 0.1)",
                            tension: 0.4,
                            fill: false,
                        },
                    ],
                },
                options: rpmOptions,
            });
            console.log("Gráfico rpmChart criado com sucesso");
        } else {
            console.error("Elemento rpmChart não encontrado!");
        }
    }

    private setupSettingsHandlers(): void {
        // Save settings button
        const saveSettingsBtn = this.getElement("saveSettingsBtn");
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener("click", () =>
                this.saveSettings()
            );
        }

        // Reset settings button
        const resetSettingsBtn = this.getElement("resetSettingsBtn");
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener("click", () =>
                this.resetSettings()
            );
        }

        // Clear suppressed alerts button
        const clearSuppressedBtn = this.getElement("clearSuppressedBtn");
        if (clearSuppressedBtn) {
            clearSuppressedBtn.addEventListener("click", () =>
                this.clearSuppressedAlerts()
            );
        }

        // Theme selector
        const themeSelect = this.getElement("themeSelect") as HTMLSelectElement;
        if (themeSelect) {
            themeSelect.value = this.settings.theme;
            themeSelect.addEventListener("change", () => {
                this.settings.theme = themeSelect.value as "dark" | "light";
                this.applyTheme(this.settings.theme);
            });
        }

        // Load current settings into form
        this.loadSettingsIntoForm();
        this.updateSuppressedAlertsList();
    }

    private startPeriodicUpdates(): void {
        // Update session time every second
        setInterval(() => {
            this.updateSessionTime();
            this.updateDataRate();
        }, 1000);

        // Update charts every 500ms for better responsiveness
        setInterval(() => {
            this.updateCharts();
        }, 500);
    }

    setConnectButtonClickHandler(handler: () => Promise<void>): void {
        console.log("UIManager: Configurando handler do botão conectar");
        console.log("UIManager: connectBtn existe:", !!this.connectBtn);
        if (this.connectBtn) {
            this.connectBtn.addEventListener("click", () => {
                console.log("UIManager: Botão conectar clicado!");
                handler();
            });
        } else {
            console.error(
                "UIManager: connectBtn não encontrado ao configurar handler!"
            );
        }
    }

    setDisconnectButtonClickHandler(handler: () => Promise<void>): void {
        this.disconnectBtn.addEventListener("click", handler);
    }

    updateUIOnConnecting(): void {
        this.connectBtn.disabled = true;
        this.connectBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Conectando...';
        this.disconnectBtn.disabled = true;

        if (this.connectionStatus) {
            this.connectionStatus.innerHTML =
                '<i class="fas fa-circle" style="color: #f59e0b;"></i> <span>Conectando...</span>';
        }
    }

    updateUIOnConnected(portInfo: string): void {
        this.connectBtn.disabled = true;
        this.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Conectar';
        this.disconnectBtn.disabled = false;

        if (this.connectionStatus) {
            this.connectionStatus.innerHTML = `<i class="fas fa-circle" style="color: #10b981;"></i> <span>Conectado - ${portInfo}</span>`;
        }
    }

    updateUIOnDisconnected(): void {
        this.connectBtn.disabled = false;
        this.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Conectar';
        this.disconnectBtn.disabled = true;

        if (this.connectionStatus) {
            this.connectionStatus.innerHTML =
                '<i class="fas fa-circle" style="color: #6b7280;"></i> <span>Desconectado</span>';
        }

        // Clear data when disconnected
        this.devices = [];
        this.updateDeviceDisplays();
        this.updateStats();
    }

    updateUIOnError(): void {
        this.connectBtn.disabled = false;
        this.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Conectar';
        this.disconnectBtn.disabled = true;

        if (this.connectionStatus) {
            this.connectionStatus.innerHTML =
                '<i class="fas fa-circle" style="color: #ef4444;"></i> <span>Erro de Conexão</span>';
        }
    }

    appendData(data: string): void {
        this.totalBytesReceived += data.length;

        if (this.dataOutput) {
            this.dataOutput.value += data;
            if (this.settings.autoScroll) {
                this.dataOutput.scrollTop = this.dataOutput.scrollHeight;
            }
        }
    }

    addDevice(device: Devices): void {
        this.devices.unshift(device); // Add to beginning

        // Keep only last 100 devices
        if (this.devices.length > 100) {
            this.devices.pop();
        }

        // Update displays
        this.updateDeviceDisplays();
        this.updateChartData(device);
        this.updateStats();
        this.checkForAlerts(device);
    }

    private updateDeviceDisplays(): void {
        this.updateRecentDevicesGrid();
        this.updateDevicesTable();
    }

    private updateRecentDevicesGrid(): void {
        if (!this.recentDevicesGrid) return;

        const recentDevices = this.devices.slice(0, 6); // Show last 6 devices

        this.recentDevicesGrid.innerHTML = recentDevices
            .map(
                (device) => `
                <div class="device-card">
                    <div class="device-header">
                        <span class="device-serial">${device.serieSlave}</span>
                        <span class="device-status ${
                            this.hasAlert(device) ? "alert" : "normal"
                        }">
                            ${this.hasAlert(device) ? "Alerta" : "Normal"}
                        </span>
                    </div>
                    <div class="device-metrics">
                        <div class="metric">
                            <span class="metric-label">Temp:</span>
                            <span class="metric-value">${device.te}°C</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">pH:</span>
                            <span class="metric-value">${device.ph}</span>
                        </div>
                    </div>
                </div>
            `
            )
            .join("");
    }

    private updateDevicesTable(): void {
        if (!this.devicesTableBody) return;

        this.devicesTableBody.innerHTML = this.devices
            .map(
                (device) => `
                <tr class="${this.hasAlert(device) ? "alert-row" : ""}">
                    <td>${device.serieSlave}</td>
                    <td>${device.macSlave}</td>
                    <td>${device.versionSlave}</td>
                    <td>${device.te}°C</td>
                    <td>${device.ph}</td>
                    <td>${device.pr}</td>
                    <td>${device.rpmS}</td>
                    <td>
                        <span class="status-badge ${
                            this.hasAlert(device) ? "alert" : "normal"
                        }">
                            ${this.hasAlert(device) ? "Alerta" : "Normal"}
                        </span>
                    </td>
                    <td>${new Date().toLocaleTimeString()}</td>
                </tr>
            `
            )
            .join("");
    }

    private updateChartData(device: Devices): void {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();

        // Add data to charts
        this.chartData.temperature.labels.push(timeLabel);
        this.chartData.temperature.data.push(parseFloat(device.te.toString()));

        this.chartData.ph.labels.push(timeLabel);
        this.chartData.ph.data.push(parseFloat(device.ph.toString()));

        this.chartData.pressure.labels.push(timeLabel);
        this.chartData.pressure.data.push(parseFloat(device.pr.toString()));

        this.chartData.rpm.labels.push(timeLabel);
        this.chartData.rpm.data.push(parseFloat(device.rpmS.toString()));

        // Limit data points to last 50
        Object.values(this.chartData).forEach((dataset) => {
            if (dataset.labels.length > 50) {
                dataset.labels.shift();
                dataset.data.shift();
            }
        });
    }

    private updateCharts(): void {
        // Update quick charts
        if (this.tempChart) {
            this.tempChart.data.labels = [...this.chartData.temperature.labels];
            this.tempChart.data.datasets[0].data = [
                ...this.chartData.temperature.data,
            ];
            this.tempChart.update("none");
        }

        if (this.phChart) {
            this.phChart.data.labels = [...this.chartData.ph.labels];
            this.phChart.data.datasets[0].data = [...this.chartData.ph.data];
            this.phChart.update("none");
        }

        // Update detailed charts
        if (this.temperatureChart) {
            this.temperatureChart.data.labels = [
                ...this.chartData.temperature.labels,
            ];
            this.temperatureChart.data.datasets[0].data = [
                ...this.chartData.temperature.data,
            ];
            this.temperatureChart.update("none");
        }

        if (this.pHChart) {
            this.pHChart.data.labels = [...this.chartData.ph.labels];
            this.pHChart.data.datasets[0].data = [...this.chartData.ph.data];
            this.pHChart.update("none");
        }

        if (this.pressureChart) {
            this.pressureChart.data.labels = [
                ...this.chartData.pressure.labels,
            ];
            this.pressureChart.data.datasets[0].data = [
                ...this.chartData.pressure.data,
            ];
            this.pressureChart.update("none");
        }

        if (this.rpmChart) {
            this.rpmChart.data.labels = [...this.chartData.rpm.labels];
            this.rpmChart.data.datasets[0].data = [...this.chartData.rpm.data];
            this.rpmChart.update("none");
        }
    }

    private updateStats(): void {
        if (this.totalDevicesElement) {
            this.totalDevicesElement.textContent =
                this.devices.length.toString();
        }

        if (this.totalDataElement) {
            this.totalDataElement.textContent =
                this.totalBytesReceived.toString();
        }
    }

    private updateSessionTime(): void {
        if (!this.sessionTimeElement) return;

        const elapsed = Date.now() - this.sessionStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);

        this.sessionTimeElement.textContent = `${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    private updateDataRate(): void {
        if (!this.dataRateElement) return;

        // Calculate data rate per second
        const ratePerSecond =
            this.totalBytesReceived /
            ((Date.now() - this.sessionStartTime) / 1000);

        let rateText: string;
        if (ratePerSecond > 1024) {
            rateText = `${(ratePerSecond / 1024).toFixed(1)} KB/s`;
        } else {
            rateText = `${ratePerSecond.toFixed(0)} B/s`;
        }

        this.dataRateElement.textContent = rateText;
    }

    updateBufferStatus(stats: { size: number; health: string }): void {
        if (this.bufferSizeElement) {
            let sizeText: string;
            if (stats.size > 1024) {
                sizeText = `${(stats.size / 1024).toFixed(1)} KB`;
            } else {
                sizeText = `${stats.size} bytes`;
            }
            this.bufferSizeElement.textContent = sizeText;
        }

        if (this.bufferHealthElement) {
            this.bufferHealthElement.textContent = this.translateHealth(
                stats.health
            );
            this.bufferHealthElement.className = `health-${stats.health.toLowerCase()}`;
        }
    }

    private translateHealth(health: string): string {
        switch (health.toLowerCase()) {
            case "good":
                return "Saudável";
            case "warning":
                return "Atenção";
            case "critical":
                return "Crítico";
            default:
                return health;
        }
    }

    private checkForAlerts(device: Devices): void {
        const temp = parseFloat(device.te.toString());
        const ph = parseFloat(device.ph.toString());

        if (temp > this.alertSettings.tempMax) {
            this.showAlert({
                title: "Temperatura Alta",
                message: `Dispositivo ${device.serieSlave}: Temperatura ${temp}°C acima do limite (${this.alertSettings.tempMax}°C)`,
                type: "warning",
            });
        }

        if (ph < this.alertSettings.phMin || ph > this.alertSettings.phMax) {
            this.showAlert({
                title: "pH Fora da Faixa",
                message: `Dispositivo ${device.serieSlave}: pH ${ph} (faixa: ${this.alertSettings.phMin}-${this.alertSettings.phMax})`,
                type: "warning",
            });
        }
    }

    private hasAlert(device: Devices): boolean {
        const temp = parseFloat(device.te.toString());
        const ph = parseFloat(device.ph.toString());

        return (
            temp > this.alertSettings.tempMax ||
            ph < this.alertSettings.phMin ||
            ph > this.alertSettings.phMax
        );
    }

    // Utility methods
    showError(message: string): void {
        this.showToast({
            id: `error-${Date.now()}`,
            type: "error",
            title: "Erro",
            message: message,
        });
    }

    private showToast(notification: ToastNotification): void {
        const container = this.getElement("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${notification.type}`;
        toast.innerHTML = `
            <strong>${notification.title}</strong><br>
            ${notification.message}
        `;

        container.appendChild(toast);

        // Auto remove toast
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, notification.duration || 5000);
    }

    private showAlert(alert: {
        title: string;
        message: string;
        type: string;
    }): void {
        // Check if this alert type is suppressed
        const alertId = `${alert.type}-${alert.title}`;
        if (this.settings.suppressedAlerts.includes(alertId)) {
            console.log(`Alerta suprimido: ${alertId}`);
            return;
        }

        const modal = this.getElement("alertModal");
        const modalBody = this.getElement("alertModalBody");
        const okButton = this.getElement("alertModalOk");
        const dontShowCheckbox = this.getElement(
            "dontShowAgainCheckbox"
        ) as HTMLInputElement;

        if (modal && modalBody && okButton) {
            // Reset checkbox
            if (dontShowCheckbox) {
                dontShowCheckbox.checked = false;
            }

            modalBody.innerHTML = `
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.message}</p>
                    <small>Horário: ${new Date().toLocaleString()}</small>
                </div>
            `;

            modal.classList.add("active");

            // Close modal function
            const closeModal = () => {
                // Check if should suppress future alerts of this type
                if (dontShowCheckbox && dontShowCheckbox.checked) {
                    this.suppressAlert(alertId);
                }

                modal.classList.remove("active");

                // Remove event listeners
                okButton.removeEventListener("click", closeModal);
                modal.removeEventListener("click", modalClickHandler);
                if (closeBtn) {
                    closeBtn.removeEventListener("click", closeModal);
                }
            };

            // Close modal handlers
            const closeBtn = modal.querySelector(".modal-close");
            const modalClickHandler = (e: Event) => {
                if (e.target === modal) {
                    closeModal();
                }
            };

            // Add event listeners
            okButton.addEventListener("click", closeModal);

            if (closeBtn) {
                closeBtn.addEventListener("click", closeModal);
            }

            modal.addEventListener("click", modalClickHandler);
        }
    }

    private suppressAlert(alertId: string): void {
        if (!this.settings.suppressedAlerts.includes(alertId)) {
            this.settings.suppressedAlerts.push(alertId);
            this.saveSettings();
            this.updateSuppressedAlertsList();

            this.showToast({
                id: `suppress-${Date.now()}`,
                type: "info",
                title: "Configuração Salva",
                message: "Este tipo de alerta não será mais exibido",
                duration: 3000,
            });
        }
    }

    clearData(): void {
        if (this.dataOutput) {
            this.dataOutput.value = "";
        }

        this.showToast({
            id: `clear-${Date.now()}`,
            type: "success",
            title: "Dados Limpos",
            message: "Os dados foram limpos com sucesso",
            duration: 2000,
        });
    }

    private exportData(): void {
        const data = {
            devices: this.devices,
            chartData: this.chartData,
            sessionInfo: {
                startTime: this.sessionStartTime,
                totalBytes: this.totalBytesReceived,
                exportTime: Date.now(),
            },
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(dataBlob);
        link.download = `portal-serial-data-${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/:/g, "-")}.json`;
        link.click();

        this.showToast({
            id: `export-${Date.now()}`,
            type: "success",
            title: "Dados Exportados",
            message: "Os dados foram exportados com sucesso",
            duration: 3000,
        });
    }

    private clearBuffer(): void {
        // This would be implemented based on your buffer management logic
        this.showToast({
            id: `clear-buffer-${Date.now()}`,
            type: "info",
            title: "Buffer Limpo",
            message: "O buffer foi limpo com sucesso",
            duration: 2000,
        });
    }

    private applyTheme(theme: "dark" | "light"): void {
        document.documentElement.setAttribute("data-theme", theme);

        // Update Chart.js theme
        if (typeof Chart !== "undefined") {
            const isDark = theme === "dark";
            Chart.defaults.color = isDark ? "#cbd5e1" : "#374151";
            Chart.defaults.backgroundColor = isDark
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(59, 130, 246, 0.1)";
            Chart.defaults.borderColor = isDark ? "#3b82f6" : "#1d4ed8";

            // Re-render all charts
            [
                this.tempChart,
                this.phChart,
                this.temperatureChart,
                this.pHChart,
                this.pressureChart,
                this.rpmChart,
            ].forEach((chart) => chart && chart.update());
        }
    }

    private loadSettings(): UISettings {
        const saved = localStorage.getItem("portal-serial-settings");
        if (saved) {
            return { ...this.getDefaultSettings(), ...JSON.parse(saved) };
        }
        return this.getDefaultSettings();
    }

    private loadAlertSettings(): AlertSettings {
        const saved = localStorage.getItem("portal-serial-alerts");
        if (saved) {
            return { ...this.getDefaultAlertSettings(), ...JSON.parse(saved) };
        }
        return this.getDefaultAlertSettings();
    }

    private getDefaultSettings(): UISettings {
        return {
            theme: "dark",
            autoScroll: true,
            maxBufferSize: 50,
            bufferTimeout: 30,
            suppressedAlerts: [],
        };
    }

    private getDefaultAlertSettings(): AlertSettings {
        return {
            tempMax: 30,
            phMin: 6.0,
            phMax: 8.0,
        };
    }

    private loadSettingsIntoForm(): void {
        // Load buffer settings
        const bufferMaxSize = this.getElement(
            "bufferMaxSize"
        ) as HTMLInputElement;
        if (bufferMaxSize)
            bufferMaxSize.value = this.settings.maxBufferSize.toString();

        const bufferTimeout = this.getElement(
            "bufferTimeout"
        ) as HTMLInputElement;
        if (bufferTimeout)
            bufferTimeout.value = this.settings.bufferTimeout.toString();

        // Load alert settings
        const tempAlert = this.getElement("tempAlert") as HTMLInputElement;
        if (tempAlert) tempAlert.value = this.alertSettings.tempMax.toString();

        const phMin = this.getElement("phMin") as HTMLInputElement;
        if (phMin) phMin.value = this.alertSettings.phMin.toString();

        const phMax = this.getElement("phMax") as HTMLInputElement;
        if (phMax) phMax.value = this.alertSettings.phMax.toString();

        // Load UI settings
        const autoScroll = this.getElement("autoScroll") as HTMLInputElement;
        if (autoScroll) autoScroll.checked = this.settings.autoScroll;
    }

    private saveSettings(): void {
        // Get form values
        const bufferMaxSize = this.getElement(
            "bufferMaxSize"
        ) as HTMLInputElement;
        const bufferTimeout = this.getElement(
            "bufferTimeout"
        ) as HTMLInputElement;
        const tempAlert = this.getElement("tempAlert") as HTMLInputElement;
        const phMin = this.getElement("phMin") as HTMLInputElement;
        const phMax = this.getElement("phMax") as HTMLInputElement;
        const autoScroll = this.getElement("autoScroll") as HTMLInputElement;

        // Update settings
        if (bufferMaxSize)
            this.settings.maxBufferSize = parseInt(bufferMaxSize.value);
        if (bufferTimeout)
            this.settings.bufferTimeout = parseInt(bufferTimeout.value);
        if (autoScroll) this.settings.autoScroll = autoScroll.checked;

        if (tempAlert) this.alertSettings.tempMax = parseFloat(tempAlert.value);
        if (phMin) this.alertSettings.phMin = parseFloat(phMin.value);
        if (phMax) this.alertSettings.phMax = parseFloat(phMax.value);

        // Save to localStorage
        localStorage.setItem(
            "portal-serial-settings",
            JSON.stringify(this.settings)
        );
        localStorage.setItem(
            "portal-serial-alerts",
            JSON.stringify(this.alertSettings)
        );

        this.showToast({
            id: `save-${Date.now()}`,
            type: "success",
            title: "Configurações Salvas",
            message: "As configurações foram salvas com sucesso",
            duration: 3000,
        });
    }

    private resetSettings(): void {
        this.settings = this.getDefaultSettings();
        this.alertSettings = this.getDefaultAlertSettings();

        localStorage.removeItem("portal-serial-settings");
        localStorage.removeItem("portal-serial-alerts");

        this.loadSettingsIntoForm();
        this.applyTheme(this.settings.theme);

        const themeSelect = this.getElement("themeSelect") as HTMLSelectElement;
        if (themeSelect) themeSelect.value = this.settings.theme;

        this.showToast({
            id: `reset-${Date.now()}`,
            type: "info",
            title: "Configurações Restauradas",
            message: "Configurações padrão foram restauradas",
            duration: 3000,
        });
    }

    // Suppressed alerts management
    private clearSuppressedAlerts(): void {
        this.settings.suppressedAlerts = [];
        this.saveSettings();
        this.updateSuppressedAlertsList();

        this.showToast({
            id: `clear-suppressed-${Date.now()}`,
            type: "success",
            title: "Configuração Salva",
            message: "Todos os alertas foram restaurados",
            duration: 3000,
        });
    }

    private updateSuppressedAlertsList(): void {
        const listContainer = this.getElement("suppressedAlertsList");
        if (!listContainer) return;

        if (this.settings.suppressedAlerts.length === 0) {
            listContainer.innerHTML = "";
            return;
        }

        listContainer.innerHTML = this.settings.suppressedAlerts
            .map((alertId) => {
                const friendlyName = this.getAlertFriendlyName(alertId);
                return `
                    <div class="suppressed-alert-item">
                        <span class="suppressed-alert-name">${friendlyName}</span>
                        <button class="suppressed-alert-remove" data-alert-id="${alertId}" title="Restaurar este alerta">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                `;
            })
            .join("");

        // Add event listeners for individual restore buttons
        listContainer
            .querySelectorAll(".suppressed-alert-remove")
            .forEach((button) => {
                button.addEventListener("click", (e) => {
                    const alertId = (e.target as HTMLElement)
                        .closest("button")
                        ?.getAttribute("data-alert-id");
                    if (alertId) {
                        this.restoreSingleAlert(alertId);
                    }
                });
            });
    }

    private getAlertFriendlyName(alertId: string): string {
        // Convert alert ID to friendly name
        const parts = alertId.split("-");
        if (parts.length >= 2) {
            const type = parts[0];
            const title = parts.slice(1).join(" ");
            return `${type.toUpperCase()}: ${title}`;
        }
        return alertId;
    }

    private restoreSingleAlert(alertId: string): void {
        const index = this.settings.suppressedAlerts.indexOf(alertId);
        if (index > -1) {
            this.settings.suppressedAlerts.splice(index, 1);
            this.saveSettings();
            this.updateSuppressedAlertsList();

            this.showToast({
                id: `restore-${Date.now()}`,
                type: "info",
                title: "Alerta Restaurado",
                message: "O alerta será exibido novamente",
                duration: 3000,
            });
        }
    }

    getSettings(): UISettings {
        return { ...this.settings };
    }

    getAlertSettings(): AlertSettings {
        return { ...this.alertSettings };
    }

    onClearBuffer(): void {
        this.clearBuffer();
    }
}
