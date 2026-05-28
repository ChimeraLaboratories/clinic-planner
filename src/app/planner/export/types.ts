export type RotaExportRow = {
    date: string;
    day: string;
    roomName: string;
    clinicianFirstName: string;
    stValue?: string;
    clValue?: string;
}

export type RotaExportOptions = {
    rows: RotaExportRow[];
    rooms: string[];
    fileName: string;
    sheetName?: string;
}