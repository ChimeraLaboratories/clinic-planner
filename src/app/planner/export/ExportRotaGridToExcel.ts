import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { RotaExportOptions } from "./types";
import {
    ExcelColours,
    getRoomCellColour,
    solidFill,
} from "./excelColourMapping";

function formatExportDate(dateString: string) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function displayRoomName(room: string) {
    return room
        .replace("ST Room ", "ROOM ")
        .replace("Room ", "ROOM ")
        .replace("Ground Floor", "GFL")
        .replace("CL Room 10", "CL10")
        .replace("CL Room 11", "CL11");
}

export async function exportRotaGridToExcel({
                                                rows,
                                                rooms,
                                                fileName,
                                                sheetName = "Rota Export",
                                            }: RotaExportOptions) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const headers = [
        "Date",
        ...rooms.map(displayRoomName),
        "Total ST Clinics",
        "Total CL Clinics",
        "RM AVL",
        "LY CLINICS",
        "NOTES",
    ];

    const startRow = 2;
    const startCol = 2;

    const dateCol = startCol;
    const firstRoomCol = startCol + 1;

    const totalStCol = startCol + rooms.length + 1;
    const totalClCol = startCol + rooms.length + 2;
    const rmAvlCol = startCol + rooms.length + 3;
    const lyClinicsCol = startCol + rooms.length + 4;
    const notesCol = startCol + rooms.length + 5;

    const stStartCol = firstRoomCol;
    const stEndCol = firstRoomCol + 7;
    const clStartCol = firstRoomCol + 8;
    const clEndCol = firstRoomCol + 9;
    const rmAvlStartCol = firstRoomCol;
    const rmAvlEndCol = firstRoomCol + 8;

    worksheet.getRow(startRow).values = [undefined, ...headers];

    const rowsByDate = new Map<string, any>();

    for (const row of rows) {
        if (!rowsByDate.has(row.date)) {
            rowsByDate.set(row.date, {
                date: row.date,
                rooms: Object.fromEntries(rooms.map((room) => [room, null])),
                lyClinics: row.lyClinics ?? 0,
                notes: "",
                dayRows: [],
            });
        }

        const exportRow = rowsByDate.get(row.date);

        exportRow.rooms[row.roomName] = row;
        exportRow.dayRows.push(row);
    }

    let currentRowNumber = startRow + 1;

    for (const exportRow of rowsByDate.values()) {
        const hasPreRegOnDay = exportRow.dayRows.some((row: any) => {
            return row.grade_code === "Pre-Reg";
        });

        const excelRow = worksheet.getRow(currentRowNumber);

        excelRow.values = [
            undefined,
            formatExportDate(exportRow.date),
            ...rooms.map((room) => exportRow.rooms[room]?.clinicianFirstName ?? ""),
            "",
            "",
            "",
            exportRow.lyClinics,
            exportRow.notes,
        ];

        excelRow.height = 18;

        const dateCell = excelRow.getCell(dateCol);
        dateCell.font = {
            bold: true,
            size: 11,
            color: { argb: ExcelColours.black },
        };

        rooms.forEach((room, index) => {
            const cell = excelRow.getCell(firstRoomCol + index);
            const allocation = exportRow.rooms[room];

            if (!allocation?.clinicianFirstName) {
                cell.fill = solidFill(ExcelColours.emptyBrown);
                cell.font = {
                    bold: false,
                    size: 11,
                    color: { argb: ExcelColours.white },
                };
                return;
            }

            const colour = getRoomCellColour({
                clinician: {
                    grade_code: allocation.grade_code,
                    is_supervisor: allocation.is_supervisor,
                },
                sessionType: allocation?.session_type ?? null,
                hasPreRegOnDay,
            });

            if (colour !== ExcelColours.emptyBrown) {
                cell.fill = solidFill(colour);
            } else {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFFF" },
                };
            }

            cell.font = {
                bold: false,
                size: 11,
                color: { argb: ExcelColours.black },
            };
        });

        const stStartLetter = worksheet.getColumn(stStartCol).letter;
        const stEndLetter = worksheet.getColumn(stEndCol).letter;
        const clStartLetter = worksheet.getColumn(clStartCol).letter;
        const clEndLetter = worksheet.getColumn(clEndCol).letter;
        const rmAvlStartLetter = worksheet.getColumn(rmAvlStartCol).letter;
        const rmAvlEndLetter = worksheet.getColumn(rmAvlEndCol).letter;

        const totalStCell = excelRow.getCell(totalStCol);
        const totalClCell = excelRow.getCell(totalClCol);
        const rmAvlCell = excelRow.getCell(rmAvlCol);
        const lyClinicsCell = excelRow.getCell(lyClinicsCol);
        const notesCell = excelRow.getCell(notesCol);

        totalStCell.value = {
            formula: `COUNTA(${stStartLetter}${currentRowNumber}:${stEndLetter}${currentRowNumber})`,
        };

        totalClCell.value = {
            formula: `COUNTA(${clStartLetter}${currentRowNumber}:${clEndLetter}${currentRowNumber})`,
        };

        rmAvlCell.value = {
            formula: `COUNTBLANK(${rmAvlStartLetter}${currentRowNumber}:${rmAvlEndLetter}${currentRowNumber})`,
        };

        totalStCell.fill = solidFill("D9EAD3");
        totalClCell.fill = solidFill("FFE699");
        lyClinicsCell.fill = solidFill("FFFFFF");
        notesCell.fill = solidFill(ExcelColours.emptyBrown);

        currentRowNumber++;
    }

    const firstDataRow = startRow + 1;
    const lastDataRow = currentRowNumber - 1;

    const totalStLetter = worksheet.getColumn(totalStCol).letter;
    const lyClinicsLetter = worksheet.getColumn(lyClinicsCol).letter;
    const rmAvlLetter = worksheet.getColumn(rmAvlCol).letter;

    worksheet.addConditionalFormatting({
        ref: `${totalStLetter}${firstDataRow}:${totalStLetter}${lastDataRow}`,
        rules: [
            {
                type: "expression",
                priority: 1,
                formulae: [`${totalStLetter}${firstDataRow}>${lyClinicsLetter}${firstDataRow}`],
                style: {
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        bgColor: { argb: "C6EFCE" },
                    },
                    font: { color: { argb: "006100" } },
                },
            },
            {
                type: "expression",
                priority: 2,
                formulae: [`${totalStLetter}${firstDataRow}<${lyClinicsLetter}${firstDataRow}`],
                style: {
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        bgColor: { argb: "FFC7CE" },
                    },
                    font: { color: { argb: "9C0006" } },
                },
            },
        ],
    });

    worksheet.addConditionalFormatting({
        ref: `${rmAvlLetter}${firstDataRow}:${rmAvlLetter}${lastDataRow}`,
        rules: [
            {
                type: "colorScale",
                priority: 3,
                cfvo: [
                    { type: "min" },
                    { type: "percentile", value: 50 },
                    { type: "max" },
                ],
                color: [
                    { argb: "63BE7B" },
                    { argb: "FFEB84" },
                    { argb: "F8696B" },
                ],
            },
        ],
    });

    worksheet.getColumn(dateCol).width = 30;

    rooms.forEach((_, index) => {
        worksheet.getColumn(firstRoomCol + index).width = 12;
    });

    worksheet.getColumn(totalStCol).width = 16;
    worksheet.getColumn(totalClCol).width = 16;
    worksheet.getColumn(rmAvlCol).width = 10;
    worksheet.getColumn(lyClinicsCol).width = 12;
    worksheet.getColumn(notesCol).width = 12;

    worksheet.views = [
        {
            state: "frozen",
            ySplit: startRow,
            xSplit: startCol,
        },
    ];

    worksheet.autoFilter = {
        from: {
            row: startRow,
            column: startCol,
        },
        to: {
            row: startRow,
            column: notesCol,
        },
    };

    const headerRow = worksheet.getRow(startRow);
    headerRow.height = 20;

    for (let col = startCol; col <= notesCol; col++) {
        const cell = headerRow.getCell(col);

        cell.fill = solidFill(ExcelColours.headerBlue);
        cell.font = {
            bold: true,
            size: 10,
            color: { argb: ExcelColours.white },
        };
        cell.alignment = {
            horizontal: "center",
            vertical: "middle",
        };
    }

    for (let rowNumber = startRow; rowNumber <= lastDataRow; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        for (let col = startCol; col <= notesCol; col++) {
            const cell = row.getCell(col);

            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            cell.alignment = {
                vertical: "middle",
            };
        }
    }

    const keyCol = notesCol + 4;

    worksheet.getCell(startRow, keyCol).value = "Colour Key";
    worksheet.getCell(startRow, keyCol).font = { bold: true };
    worksheet.getCell(startRow, keyCol).alignment = { horizontal: "center" };
    worksheet.getCell(startRow, keyCol).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };

    const colourKey = [
        ["CONTINUOUS", "FF00FF"],
        ["ST PRE-REG", "FFC000"],
        ["ST SUPERVISOR", "FFFF00"],
        ["CL PRE-REG", "F4B084"],
        ["CL SUPERVISOR", "FFD966"],
        ["NEED SUPERVISOR", "FF0000"],
    ];

    colourKey.forEach(([label, colour], index) => {
        const cell = worksheet.getCell(startRow + 1 + index, keyCol);
        cell.value = label;
        cell.fill = solidFill(colour);
        cell.font = {
            bold: true,
            color: { argb: colour === "FF0000" ? "FFFFFF" : "000000" },
        };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
        new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${fileName}.xlsx`
    );
}