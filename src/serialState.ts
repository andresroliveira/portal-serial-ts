// Estado global da aplicação
export interface SerialState {
    isConnected: boolean;
    lastData: string;
    dataHistory: string[];
    connectionTime: Date | null;
    totalBytesReceived: number;
}

// Variável global de estado
export let globalSerialState: SerialState = {
    isConnected: false,
    lastData: "",
    dataHistory: [],
    connectionTime: null,
    totalBytesReceived: 0,
};

// Funções para atualizar o estado
export function updateSerialState(updates: Partial<SerialState>): void {
    globalSerialState = { ...globalSerialState, ...updates };
    console.log("Estado atualizado:", globalSerialState);
}

export function addDataToHistory(data: string): void {
    globalSerialState.lastData = data;
    globalSerialState.dataHistory.push(data);
    globalSerialState.totalBytesReceived += data.length;

    // Manter apenas os últimos 100 registros
    if (globalSerialState.dataHistory.length > 100) {
        globalSerialState.dataHistory.shift();
    }
}

export function resetSerialState(): void {
    globalSerialState = {
        isConnected: false,
        lastData: "",
        dataHistory: [],
        connectionTime: null,
        totalBytesReceived: 0,
    };
}

export function getSerialState(): SerialState {
    return { ...globalSerialState }; // Retorna uma cópia para evitar mutações
}
