// Exemplo para testar o parser com dados reais do ESP32
import { SerialDataParser } from "./serialDataParser.js";
import { Devices } from "./devices.js";

// Dados de exemplo que você forneceu
const exemploDataESP32 = `ESP-ROM:esp32c3-api1-20210207
e":"","ph":"","pr":"","rd":"","teS":"","rpmS":""}]}{"dispositivos":[{"type":"dados","serieSlave":"20100402025","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"20.69545555","ph":"5.395999908","pr":"3.801954746","rd":"","teS":"24","rpmS":"138"}]}{"dispositivos":[{"type":"dados","serieSlave":"20100402025","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"20.65291786","ph":"5.395999908","pr":"0.01","rd":"","teS":"24","rpmS":"138"}]}`;

export function testarParser() {
    console.log("🧪 Testando parser com dados reais do ESP32...");

    // Criar parser com callback
    const parser = new SerialDataParser((device: Devices) => {
        console.log("✅ Device processado:", device.toString());
        console.log("   📊 Detalhes:");
        console.log(`      Série: ${device.serieSlave}`);
        console.log(`      MAC: ${device.macSlave}`);
        console.log(`      Versão: ${device.versionSlave}`);
        console.log(`      Temperatura: ${device.te}°C`);
        console.log(`      PH: ${device.ph}`);
        console.log(`      Pressão: ${device.pr}`);
        console.log(`      RPM: ${device.rpmS}`);
        console.log("   ---");
    });

    // Processar dados de exemplo
    const devices = parser.processData(exemploDataESP32);

    console.log(`📊 Total de ${devices.length} dispositivos processados`);

    // Mostrar estatísticas do buffer
    const stats = parser.getBufferStats();
    console.log("📝 Buffer stats:", stats);

    return devices;
}

// Função para simular dados chegando em pedaços (como na serial real)
export function simularDadosSerialChunks() {
    console.log("🎭 Simulando dados chegando em pedaços...");

    const parser = new SerialDataParser((device: Devices) => {
        console.log(
            `📡 Device recebido: ${device.serieSlave} - Temp: ${device.te}°C`
        );
    });

    // Simular dados chegando em pedaços pequenos (como acontece na serial)
    const chunks = [
        `{"dispositivos":[{"type":"dados","serie`,
        `Slave":"20100402025","macSlave":"10:02:00:28:e1:f2","version`,
        `Slave":"3.2.2","te":"25.5","ph":"6.8","pr":"2.1","rd":"","teS":"24","rpmS":"140"}]}`,
        `{"dispositivos":[{"type":"dados","serieSlave":"20100402025","macSlave":"10:02:00:28:e1:f2",`,
        `"versionSlave":"3.2.2","te":"25.8","ph":"6.9","pr":"2.3","rd":"","teS":"24","rpmS":"142"}]}`,
    ];

    chunks.forEach((chunk, index) => {
        console.log(`📦 Processando chunk ${index + 1}:`, chunk);
        parser.processData(chunk);
    });
}

// Função para demonstrar alertas baseados em dados
export function demonstrarAlertas() {
    console.log("🚨 Demonstrando sistema de alertas...");

    const parser = new SerialDataParser((device: Devices) => {
        // Alertas de temperatura
        if (device.te > 30) {
            console.warn(
                `🔥 ALERTA: Temperatura muito alta! ${device.te}°C no device ${device.serieSlave}`
            );
        } else if (device.te < 10) {
            console.warn(
                `🧊 ALERTA: Temperatura muito baixa! ${device.te}°C no device ${device.serieSlave}`
            );
        }

        // Alertas de PH
        if (device.ph > 8.5) {
            console.warn(
                `⬆️ ALERTA: PH muito alto! ${device.ph} no device ${device.serieSlave}`
            );
        } else if (device.ph < 6.5) {
            console.warn(
                `⬇️ ALERTA: PH muito baixo! ${device.ph} no device ${device.serieSlave}`
            );
        }

        // Alertas de RPM
        if (device.rpmS > 200) {
            console.warn(
                `⚡ ALERTA: RPM muito alto! ${device.rpmS} no device ${device.serieSlave}`
            );
        }
    });

    // Dados de teste com valores que disparam alertas
    const dadosComAlertas = [
        `{"dispositivos":[{"type":"dados","serieSlave":"TEST001","macSlave":"AA:BB:CC:DD:EE:FF","versionSlave":"1.0","te":"35.5","ph":"9.2","pr":"1.0","rd":"","teS":"24","rpmS":"250"}]}`,
        `{"dispositivos":[{"type":"dados","serieSlave":"TEST002","macSlave":"AA:BB:CC:DD:EE:FF","versionSlave":"1.0","te":"5.2","ph":"5.8","pr":"1.0","rd":"","teS":"24","rpmS":"50"}]}`,
    ];

    dadosComAlertas.forEach((dados) => {
        parser.processData(dados);
    });
}
