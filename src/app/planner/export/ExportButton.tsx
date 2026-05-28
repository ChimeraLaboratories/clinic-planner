"use client";

import {RotaExportRow} from "@/app/planner/export/types";
import {useState} from "react";
import {exportRotaGridToExcel} from "@/app/planner/export/ExportRotaGridToExcel";

type ExportButtonProps = {
    rows: RotaExportRow[];
    rooms: string[];
    fileName?: string;
};

export function ExportButton({
    rows,
    rooms,
    fileName = "clinic-planner-rota-export", }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    function handleExport() {
        try {
            setIsExporting(true);

            exportRotaGridToExcel({
                rows,
                rooms,
                fileName,
            });
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <button type="button" onClick={handleExport} disabled={isExporting || rows.length === 0}>
            {isExporting ? "Exporting..." : "Export"}
        </button>
    );
}