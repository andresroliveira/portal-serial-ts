import { Devices } from "./devices.js";

export function toDevice(dispJson: Record<string, unknown>) {
    if (
        !dispJson.hasOwnProperty("type") ||
        !dispJson.hasOwnProperty("serieSlave") ||
        !dispJson.hasOwnProperty("macSlave") ||
        !dispJson.hasOwnProperty("versionSlave") ||
        !dispJson.hasOwnProperty("te") ||
        !dispJson.hasOwnProperty("ph") ||
        !dispJson.hasOwnProperty("pr") ||
        !dispJson.hasOwnProperty("rd") ||
        !dispJson.hasOwnProperty("teS") ||
        !dispJson.hasOwnProperty("rpmS")
    ) {
        console.error("Invalid device format: missing required properties.");
        return null;
    }
    if (
        typeof dispJson.type !== "string" ||
        typeof dispJson.serieSlave !== "string" ||
        typeof dispJson.macSlave !== "string" ||
        typeof dispJson.versionSlave !== "string" ||
        typeof dispJson.te !== "string" ||
        typeof dispJson.ph !== "string" ||
        typeof dispJson.pr !== "string" ||
        typeof dispJson.rd !== "string" ||
        typeof dispJson.teS !== "string" ||
        typeof dispJson.rpmS !== "string"
    ) {
        console.error("Invalid device format: properties must be strings.");
        return null;
    }

    let type = dispJson.type.toLowerCase();
    let serialSlave = dispJson.serieSlave.toLowerCase();
    let macSlave = dispJson.macSlave.toLowerCase();
    let versionSlave = dispJson.versionSlave.toLowerCase();
    let te = parseFloat(dispJson.te);
    let ph = parseFloat(dispJson.ph);
    let pr = parseFloat(dispJson.pr);
    let rd = parseFloat(dispJson.rd);
    let teS = parseFloat(dispJson.teS);
    let rpmS = parseFloat(dispJson.rpmS);

    // Verificar se é NaN e substituir por 0
    te = isNaN(te) ? 0 : te;
    ph = isNaN(ph) ? 0 : ph;
    pr = isNaN(pr) ? 0 : pr;
    rd = isNaN(rd) ? 0 : rd;
    teS = isNaN(teS) ? 0 : teS;
    rpmS = isNaN(rpmS) ? 0 : rpmS;

    return new Devices(
        type,
        serialSlave,
        macSlave,
        versionSlave,
        te,
        ph,
        pr,
        rd,
        teS,
        rpmS
    );
}

// Funções para navegador usando localStorage ao invés de arquivos
export function saveDeviceData(dispositivo: Devices) {
    const timestamp = new Date().toISOString();
    const key = `device_${dispositivo.serieSlave}_${timestamp}`;

    localStorage.setItem(
        key,
        JSON.stringify({
            timestamp,
            dispositivo,
        })
    );

    console.log(`Device data saved: ${key}`);
}

export function getDeviceHistory(serieSlave: string): any[] {
    const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`device_${serieSlave}_`)
    );

    return keys
        .map((key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        })
        .filter((item) => item !== null);
}

export function exportToCSV(dispositivos: Devices[]): string {
    const header =
        "timestamp,type,serieSlave,macSlave,versionSlave,te,ph,pr,rd,teS,rpmS\n";
    const timestamp = new Date().toISOString();

    const rows = dispositivos
        .map((d) =>
            [
                timestamp,
                d.type,
                d.serieSlave,
                d.macSlave,
                d.versionSlave,
                d.te,
                d.ph,
                d.pr,
                d.rd,
                d.teS,
                d.rpmS,
            ].join(",")
        )
        .join("\n");

    return header + rows;
}

export function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
