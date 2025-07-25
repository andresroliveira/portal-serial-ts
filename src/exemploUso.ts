// Exemplo de uso do sistema de eventos serial
import { SerialManager } from "./serialManager.js";
import { getSerialState, globalSerialState } from "./serialState.js";

// Criar instância do serial manager
const serial = new SerialManager();

// EXATAMENTE O QUE VOCÊ QUERIA!
serial.on("data", (data: string) => {
    console.log("Dados recebidos:", data);

    // Acessar estado global
    console.log("Estado atual:", getSerialState());
    console.log("Último dado:", globalSerialState.lastData);
    console.log("Total de bytes:", globalSerialState.totalBytesReceived);
});

// Outros eventos disponíveis
serial.on("connected", (port: any) => {
    console.log("Conectado à porta:", port);
});

serial.on("disconnected", () => {
    console.log("Desconectado");
});

serial.on("error", (error: any) => {
    console.error("Erro:", error);
});

// Usar o serial
async function exemploUso() {
    try {
        // Conectar (abre diálogo para usuário selecionar porta)
        const port = await serial.requestAndConnect();

        // A partir daqui, qualquer dado que chegar dispara o evento "data"
        // Você não precisa fazer loop infinito ou polling!
    } catch (error) {
        console.error("Erro ao conectar:", error);
    }
}

export { serial, exemploUso };
