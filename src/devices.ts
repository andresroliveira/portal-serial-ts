export class Dispositivo {
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
        rpmS: number,
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
}
