type RotaExportRow = {
    date: string;
    day: string;
    roomName: string;
    clinicianFirstName: string;
    stValue?: string;
    clValue?: string;
    rmAvailable?: number;
    lyClinics?: number;
}
export default RotaExportRow

export type RotaExportOptions = {
    rows: RotaExportRow[];
    rooms: string[];
    fileName: string;
    sheetName?: string;
}