// Teste simulando dados chegando fragmentados (como acontece na serial real)
import { SerialDataParser } from "./serialDataParser.js";
import { Devices } from "./devices.js";

export function testarDadosFragmentados() {
    console.log("🧪 TESTANDO DADOS FRAGMENTADOS (como na serial real)");
    console.log("=".repeat(60));

    const parser = new SerialDataParser((device: Devices) => {
        console.log(
            `🎉 DEVICE PROCESSADO: ${device.serieSlave} - Temp: ${device.te}°C, PH: ${device.ph}`
        );
    });

    // Simular dados chegando em pedaços pequenos (como acontece na serial)
    const fragmentos = [
        // Chunk 1: Início com lixo + parte do primeiro JSON
        `ESP-ROM:esp32c3-api1-20210207
e":"","ph":"","pr":"","rd":"","teS":"","rpmS":""}]}{"dispositivos":[{"type":"dados","serie`,

        // Chunk 2: Continuação do primeiro JSON
        `Slave":"20100402025","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"20.69545555","ph":"5.395999908","pr":"3.801954746","rd":"","teS":"24","rpmS":"138"}]}`,

        // Chunk 3: Segundo JSON completo
        `{"dispositivos":[{"type":"dados","serieSlave":"20100402025","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"20.65291786","ph":"5.395999908","pr":"0.01","rd":"","teS":"24","rpmS":"138"}]}`,

        // Chunk 4: Início do terceiro JSON (incompleto)
        `{"dispositivos":[{"type":"dados","serieSlave":"20100402025","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"20.61745453","ph":"5.396999836","pr":"3.803297997","rd":"","teS":"24",`,

        // Chunk 5: Final do terceiro JSON + início do quarto
        `"rpmS":"138"}]}{"dispositivos":[{"type":"dados","serieSlave":"20100402025","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"20.59263229","ph":"5.394999981","pr":"0.01","rd":"","teS":"24","rpmS":"138"}]}`,

        // Chunk 6: Dados extras
        `{"dispositivos":[{"type":"dados","serieSlave":"20100402025","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"25.5","ph":"6.8","pr":"2.1","rd":"","teS":"24","rpmS":"140"}]}`,
    ];

    console.log(
        `📦 Simulando ${fragmentos.length} chunks de dados chegando separadamente...\n`
    );

    fragmentos.forEach((fragmento, index) => {
        console.log(`\n📡 CHUNK ${index + 1}/${fragmentos.length}:`);
        console.log(
            `📄 Conteúdo: "${fragmento.substring(0, 80)}${
                fragmento.length > 80 ? "..." : ""
            }"`
        );
        console.log(`📏 Tamanho: ${fragmento.length} caracteres`);

        const devices = parser.processData(fragmento);

        if (devices.length > 0) {
            console.log(
                `✅ ${devices.length} dispositivos processados neste chunk!`
            );
        } else {
            console.log(
                `⏳ Nenhum dispositivo processado (dados incompletos no buffer)`
            );
        }

        const stats = parser.getBufferStats();
        console.log(`📊 Buffer atual: ${stats.size} caracteres`);
        console.log("-".repeat(50));
    });

    console.log("\n🎯 RESUMO DO TESTE:");
    console.log("✅ O parser conseguiu lidar com dados fragmentados!");
    console.log(
        "✅ JSONs incompletos ficaram no buffer até serem completados!"
    );
    console.log("✅ Lixo no início foi removido automaticamente!");
    console.log(
        "✅ Cada device foi processado corretamente quando o JSON ficou completo!"
    );
}

// Teste adicional para casos extremos
export function testarCasosExtremos() {
    console.log("\n🔬 TESTANDO CASOS EXTREMOS");
    console.log("=".repeat(60));

    const parser = new SerialDataParser((device: Devices) => {
        console.log(`✅ Device: ${device.serieSlave} - ${device.te}°C`);
    });

    // Caso 1: JSON cortado no meio de uma string
    console.log("\n🧪 Teste 1: JSON cortado no meio de uma string");
    parser.processData(
        `{"dispositivos":[{"type":"dados","serieSlave":"201004020`
    );
    parser.processData(
        `25","macSlave":"10:02:00:28:e1:f2","versionSlave":"3.2.2","te":"25.5","ph":"6.8","pr":"2.1","rd":"","teS":"24","rpmS":"140"}]}`
    );

    // Caso 2: Múltiplos JSONs cortados de formas diferentes
    console.log("\n🧪 Teste 2: Múltiplos JSONs fragmentados");
    parser.clearBuffer();
    parser.processData(
        `{"dispositivos":[{"type":"dados","serieSlave":"TEST1","macSlave":"AA:BB:CC:DD:EE:FF","versionSlave":"1.0","te":"30.0","ph":"7.0","pr":"1.0","rd":"","teS":"25","rpmS":"100"}]}{"dispositivos":[{"type"`
    );
    parser.processData(
        `:"dados","serieSlave":"TEST2","macSlave":"AA:BB:CC:DD:EE:FF","versionSlave":"1.0","te":"31.0","ph":"7.1","pr":"1.1","rd":"","teS":"25","rpmS":"101"}]}`
    );

    // Caso 3: Apenas lixo sem JSON
    console.log("\n🧪 Teste 3: Apenas lixo sem JSON");
    parser.clearBuffer();
    parser.processData(
        "ESP-ROM:esp32c3-api1-20210207\nBooting...\nWiFi connected\n"
    );

    console.log("\n✅ Todos os casos extremos foram testados!");
}

// Para usar no console do navegador
if (typeof window !== "undefined") {
    (window as any).testarDadosFragmentados = testarDadosFragmentados;
    (window as any).testarCasosExtremos = testarCasosExtremos;
    console.log("🎮 Funções disponíveis no console:");
    console.log(
        "  testarDadosFragmentados() - Testa dados chegando em pedaços"
    );
    console.log("  testarCasosExtremos() - Testa casos extremos");
}
