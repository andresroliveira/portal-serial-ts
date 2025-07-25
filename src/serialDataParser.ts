import { Devices, SerialResponse, DeviceData } from "./devices.js";

export class SerialDataParser {
    private buffer: string = "";
    private onDeviceCallback: ((device: Devices) => void) | null = null;
    private maxBufferSize: number = 50000; // Limite do buffer (50KB)
    private bufferTimeout: number = 30000; // 30 segundos
    private lastCleanupTime: number = Date.now();

    constructor(onDevice?: (device: Devices) => void) {
        this.onDeviceCallback = onDevice || null;
    }

    processData(newData: string): Devices[] {
        this.checkBufferHealth();

        this.buffer += newData;
        const devices: Devices[] = [];

        const jsonObjects = this.extractCompleteJSONs();

        for (const jsonStr of jsonObjects) {
            try {
                const parsed = JSON.parse(jsonStr) as SerialResponse;

                if (parsed.dispositivos && Array.isArray(parsed.dispositivos)) {
                    for (const deviceData of parsed.dispositivos) {
                        const device = Devices.fromSerialData(deviceData);

                        if (device.isValid()) {
                            devices.push(device);

                            if (this.onDeviceCallback) {
                                this.onDeviceCallback(device);
                            }
                        } else {
                            console.warn(
                                "Device inválido ignorado:",
                                deviceData
                            );
                        }
                    }
                } else {
                    console.warn("JSON sem dispositivos válidos:", parsed);
                }
            } catch (error) {
                console.error("Erro ao fazer parse do JSON:", error);
                console.error("JSON problemático:", jsonStr.substring(0, 200));
            }
        }

        return devices;
    }

    // Verifica a "saúde" do buffer e limpa se necessário
    private checkBufferHealth(): void {
        const now = Date.now();
        const timeSinceLastCleanup = now - this.lastCleanupTime;

        // Caso 1: Buffer muito grande (proteção contra memória)
        if (this.buffer.length > this.maxBufferSize) {
            console.warn(
                `Buffer muito grande (${this.buffer.length} chars), limpando...`
            );
            this.emergencyBufferCleanup();
            return;
        }

        // Caso 2: Buffer antigo sem JSONs válidos (proteção contra dados corrompidos)
        if (
            timeSinceLastCleanup > this.bufferTimeout &&
            this.buffer.length > 0
        ) {
            console.warn(
                `Buffer antigo detectado (${timeSinceLastCleanup}ms), verificando integridade...`
            );

            // Se não há nenhum início de JSON válido, limpar tudo
            if (!this.buffer.includes('{"dispositivos":')) {
                console.warn(
                    "Nenhum JSON válido encontrado no buffer, limpando completamente"
                );
                this.buffer = "";
                this.lastCleanupTime = now;
                return;
            }

            // Se há dados muito antigos no início, remover
            this.cleanOldDataFromBuffer();
        }
    }

    // Limpeza de emergência quando buffer fica muito grande
    private emergencyBufferCleanup(): void {
        console.warn("LIMPEZA DE EMERGÊNCIA DO BUFFER");

        // Tentar salvar apenas a parte mais recente que pode conter JSON
        const lastJsonStart = this.buffer.lastIndexOf('{"dispositivos":');

        if (lastJsonStart !== -1) {
            // Manter apenas os últimos dados que podem ser um JSON
            const keepSize = Math.min(
                10000,
                this.buffer.length - lastJsonStart
            );
            this.buffer = this.buffer.substring(this.buffer.length - keepSize);
            console.warn(
                `Buffer reduzido para ${this.buffer.length} caracteres`
            );
        } else {
            // Se não há JSON válido, limpar tudo
            this.buffer = "";
            console.warn(
                "Buffer completamente limpo - nenhum JSON válido encontrado"
            );
        }

        this.lastCleanupTime = Date.now();
    }

    // Remove dados antigos do início do buffer
    private cleanOldDataFromBuffer(): void {
        const originalSize = this.buffer.length;

        // Encontrar o último JSON completo válido
        let lastValidEnd = -1;
        let searchPos = 0;

        while (searchPos < this.buffer.length) {
            const jsonStart = this.buffer.indexOf(
                '{"dispositivos":',
                searchPos
            );
            if (jsonStart === -1) break;

            const jsonEnd = this.findJSONEnd(jsonStart);
            if (jsonEnd !== -1) {
                lastValidEnd = jsonEnd + 1;
                searchPos = jsonEnd + 1;
            } else {
                break; // JSON incompleto, parar aqui
            }
        }

        // Se encontrou JSONs válidos, remover dados antigos antes deles
        if (lastValidEnd > 0 && lastValidEnd < this.buffer.length * 0.8) {
            this.buffer = this.buffer.substring(lastValidEnd);
            console.warn(
                `Removidos ${
                    originalSize - this.buffer.length
                } caracteres antigos do buffer`
            );
        }

        this.lastCleanupTime = Date.now();
    }

    private extractCompleteJSONs(): string[] {
        const jsonObjects: string[] = [];

        this.cleanBufferStart();

        let searchIndex = 0;
        let consecutiveFailures = 0;
        const maxFailures = 5; // Limite de falhas consecutivas

        while (
            searchIndex < this.buffer.length &&
            consecutiveFailures < maxFailures
        ) {
            // Procurar início de JSON
            const startMatch = this.buffer.indexOf(
                '{"dispositivos":',
                searchIndex
            );
            if (startMatch === -1) {
                break; // Não há mais JSONs
            }

            // console.log("JSON início encontrado na posição:", startMatch);

            // Encontrar o final do JSON usando contagem de chaves
            const jsonEnd = this.findJSONEnd(startMatch);

            if (jsonEnd !== -1) {
                const jsonStr = this.buffer.substring(startMatch, jsonEnd + 1);
                // console.log("JSON completo extraído:", jsonStr.length, "caracteres");
                // Validar se o JSON é realmente válido antes de adicionar
                if (this.isValidJSON(jsonStr)) {
                    jsonObjects.push(jsonStr);
                    consecutiveFailures = 0; // Reset contador de falhas
                } else {
                    console.warn("JSON extraído é inválido, pulando...");
                    consecutiveFailures++;
                }

                searchIndex = jsonEnd + 1;
            } else {
                // JSON incompleto - parar e manter no buffer
                // console.log( "JSON incompleto detectado, aguardando mais dados...");
                break;
            }
        }
        if (consecutiveFailures >= maxFailures) {
            console.warn(
                "Muitas falhas consecutivas detectadas, pode haver dados corrompidos"
            );
            this.handleCorruptedData(searchIndex);
        }

        // Remover JSONs processados do buffer
        if (jsonObjects.length > 0 && searchIndex > 0) {
            this.buffer = this.buffer.substring(searchIndex);
            // console.log( `Buffer limpo, ${jsonObjects.length} JSONs processados, restam: ${this.buffer.length} caracteres`);
            this.lastCleanupTime = Date.now(); // Atualizar tempo da última limpeza
        }

        return jsonObjects;
    }

    private isValidJSON(jsonStr: string): boolean {
        try {
            const parsed = JSON.parse(jsonStr);
            return parsed && typeof parsed === "object" && parsed.dispositivos;
        } catch {
            return false;
        }
    }

    private handleCorruptedData(problemPosition: number): void {
        console.warn("Lidando com possíveis dados corrompidos...");

        // Encontrar próximo início de JSON válido após a posição problemática
        const nextValidStart = this.buffer.indexOf(
            '{"dispositivos":',
            problemPosition + 100
        );

        if (nextValidStart !== -1) {
            // Pular dados corrompidos
            const skippedData = this.buffer.substring(
                problemPosition,
                nextValidStart
            );
            // console.warn(
            //     `Pulando ${skippedData.length} caracteres possivelmente corrompidos`
            // );
            // console.warn(
            //     "Dados pulados:",
            //     skippedData.substring(0, 200) + "..."
            // );

            this.buffer = this.buffer.substring(nextValidStart);
        } else {
            // Se não encontrar mais JSONs válidos, limpar buffer problemático
            console.warn(
                "Nenhum JSON válido encontrado após dados corrompidos, limpando buffer"
            );
            this.buffer = "";
        }
    }

    private cleanBufferStart(): void {
        const firstJsonIndex = this.buffer.indexOf('{"dispositivos":');
        if (firstJsonIndex > 0) {
            const removedText = this.buffer.substring(0, firstJsonIndex);
            this.buffer = this.buffer.substring(firstJsonIndex);
        }
    }

    // Encontra o final de um JSON usando contagem de chaves
    private findJSONEnd(startIndex: number): number {
        let braceCount = 0;
        let inString = false;
        let escaped = false;

        for (let i = startIndex; i < this.buffer.length; i++) {
            const char = this.buffer[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === "\\") {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === "{") {
                    braceCount++;
                } else if (char === "}") {
                    braceCount--;

                    if (braceCount === 0) {
                        // console.log("Final do JSON encontrado na posição:", i);
                        return i; // Fim do JSON encontrado
                    }
                }
            }
        }

        // console.log("JSON incompleto - braceCount:", braceCount);
        return -1; // JSON incompleto
    }

    // Limpa o buffer manualmente
    clearBuffer(): void {
        this.buffer = "";
        this.lastCleanupTime = Date.now();
        console.log("Buffer limpo manualmente");
    }

    // Define callback para quando um device é processado
    setOnDeviceCallback(callback: (device: Devices) => void): void {
        this.onDeviceCallback = callback;
    }

    // Retorna estatísticas do buffer
    getBufferStats(): {
        size: number;
        content: string;
        lastCleanup: number;
        health: string;
    } {
        const now = Date.now();
        const timeSinceCleanup = now - this.lastCleanupTime;

        let health = "healthy";
        if (this.buffer.length > this.maxBufferSize * 0.8) {
            health = "warning";
        } else if (this.buffer.length > this.maxBufferSize * 0.9) {
            health = "critical";
        }

        return {
            size: this.buffer.length,
            content: this.buffer,
            lastCleanup: timeSinceCleanup,
            health: health,
        };
    }

    // Configurar parâmetros de limpeza
    setBufferLimits(maxSize: number, timeoutMs: number): void {
        this.maxBufferSize = maxSize;
        this.bufferTimeout = timeoutMs;
        // console.log( `Buffer limits updated: maxSize=${maxSize}, timeout=${timeoutMs}ms`);
    }
}
