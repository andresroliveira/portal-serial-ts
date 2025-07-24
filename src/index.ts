import { createSerialPort } from "./serial";
import { Dispositivo } from "./devices";
const PORT = "/dev/ttyACM0";

function handleSerialData(message: string) {
    let json: Record<string, unknown>;
    try {
        json = JSON.parse(message);
    } catch (error) {
        console.error("Invalid JSON received.");
        return;
    }

    console.log("-------------------------");
    console.log("Received data: ", json);

    if (!json.hasOwnProperty("dispositivos")) {
        console.error("Invalid data format: 'dispositivos' key not found.");
        return;
    }

    if (!Array.isArray(json.dispositivos)) {
        console.error(
            "Invalid data format: 'dispositivos' should be an array."
        );
        return;
    }

    if (json.dispositivos.length === 0) {
        console.log("No devices found.");
        return;
    }

    const dispositivosJson = json.dispositivos;

    const dispositivos = dispositivosJson
        .map((dispJson: Record<string, unknown>) => {
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
                console.error(
                    "Invalid device format: missing required properties."
                );
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
                console.error(
                    "Invalid device format: properties must be strings."
                );
                return null;
            }
            return {
                type: dispJson.type as string,
                serieSlave: dispJson.serieSlave as string,
                macSlave: dispJson.macSlave as string,
                versionSlave: dispJson.versionSlave as string,
                te: dispJson.te as string,
                ph: dispJson.ph as string,
                pr: dispJson.pr as string,
                rd: dispJson.rd as string,
                teS: dispJson.teS as string,
                rpmS: dispJson.rpmS as string,
            } as Dispositivo;
        })
        .filter((dispositivo) => dispositivo !== null);

    if (dispositivos.length === 0) {
        console.error("No valid devices found.");
        return;
    }

    console.log("Dispositivos: ", dispositivos);
}

function main() {
    createSerialPort(PORT, 9600, handleSerialData);
}

(() => main())();
