import * as XLSX from "xlsx";
import type { RotaExportOptions } from "./types";

export function exportRotaGridToExcel({
                                          rows,
                                          rooms,
                                          fileName,
                                          sheetName = "Rota Export",
                                      }: RotaExportOptions) {
    const rowsByDate = new Map<string, any>();

    for (const row of rows) {
        if (!rowsByDate.has(row.date)) {
            rowsByDate.set(row.date, {
                Date: row.date,
                Day: row.day,
                ...Object.fromEntries(rooms.map((room) => [room, ""])),
                "ST TTL": 0,
                "CL TTL": 0,
                "WK ST TTL": "",
            });
        }

        const exportRow = rowsByDate.get(row.date);

        exportRow[row.roomName] = row.clinicianFirstName || "";
        exportRow["ST TTL"] += row.stValue ?? 0;
        exportRow["CL TTL"] += row.clValue ?? 0;
    }

    const exportRows = Array.from(rowsByDate.values());

    const worksheet = XLSX.utils.json_to_sheet(exportRows, {
        header: ["Date", "Day", ...rooms, "ST TTL", "CL TTL", "WK ST TTL"],
    });

    worksheet["!cols"] = [
        { wch: 14 },
        { wch: 10 },
        ...rooms.map(() => ({ wch: 16 })),
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}