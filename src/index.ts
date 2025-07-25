import { AppController } from "./appController.js";

async function main() {
    if (!("serial" in navigator)) {
        console.error("Web Serial API não é suportada neste navegador.");
        return;
    }

    console.log("Web Serial API disponível:", navigator.serial);

    try {
        const app = new AppController();
        await app.initialize();
    } catch (error) {
        console.error("Erro ao inicializar aplicação:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}
