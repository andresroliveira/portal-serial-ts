export interface DeviceData {
    type: string;
    serieSlave: string;
    macSlave: string;
    versionSlave: string;
    te: string;
    ph: string;
    pr: string;
    rd: string;
    teS: string;
    rpmS: string;
}

export interface SerialResponse {
    dispositivos: DeviceData[];
}

export class Devices {
    type: string;
    serieSlave: string;
    macSlave: string;
    versionSlave: string;
    te: number;
    ph: number;
    pr: number;
    rd: number;
    teS: number;
    rpmS: number;

    constructor(
        type: string,
        serieSlave: string,
        macSlave: string,
        versionSlave: string,
        te: number,
        ph: number,
        pr: number,
        rd: number,
        teS: number,
        rpmS: number
    ) {
        this.type = type;
        this.serieSlave = serieSlave;
        this.macSlave = macSlave;
        this.versionSlave = versionSlave;
        this.te = te;
        this.ph = ph;
        this.pr = pr;
        this.rd = rd;
        this.teS = teS;
        this.rpmS = rpmS;
    }

    // Método estático para criar Device a partir de dados da serial
    static fromSerialData(data: DeviceData): Devices {
        return new Devices(
            data.type,
            data.serieSlave,
            data.macSlave,
            data.versionSlave,
            parseFloat(data.te) || 0,
            parseFloat(data.ph) || 0,
            parseFloat(data.pr) || 0,
            parseFloat(data.rd) || 0,
            parseFloat(data.teS) || 0,
            parseFloat(data.rpmS) || 0
        );
    }

    // Método para validar se os dados são válidos
    isValid(): boolean {
        return (
            this.type === "dados" &&
            this.serieSlave !== "" &&
            this.macSlave !== "" &&
            !isNaN(this.te)
        );
    }

    // Método para formato de exibição
    toString(): string {
        return `Device[${this.serieSlave}] - Temp: ${this.te}°C, PH: ${this.ph}, Pressão: ${this.pr}`;
    }
}
