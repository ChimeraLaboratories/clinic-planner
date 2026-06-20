export const ExcelColours = {
    headerBlue: "4472C4",
    emptyBrown: "752728",

    stPreReg: "FFC000",
    clPreReg: "F4B084",

    stSupervisor: "FFFF00",
    clSupervisor: "FFD966",

    needSupervisor: "FF0000",

    goodBg: "C6EFCE",
    goodText: "006100",

    badBg: "FFC7CE",
    badText: "9C0006",

    rmRed: "F8696B",
    rmYellow: "FFEB84",
    rmGreen: "63BE7B",

    white: "FFFFFF",
    black: "000000",
};

export function solidFill(argb: string) {
    return {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb },
    };
}

export function getRmAvailableColour(value: number, max: number) {
    if (!max || value <= 0) return ExcelColours.rmRed;

    const ratio = value / max;

    if (ratio <= 0.4) return ExcelColours.rmRed;
    if (ratio <= 0.75) return ExcelColours.rmYellow;

    return ExcelColours.rmGreen;
}

type SessionType = "ST" | "CL";

type ExportClinician = {
    grade_code?: string | null;
    is_supervisor?: boolean | number | null;
};

export function getRoomCellColour({
                                      clinician,
                                      sessionType,
                                      hasPreRegOnDay,
                                  }: {
    clinician: ExportClinician | null;
    sessionType: SessionType | null;
    hasPreRegOnDay: boolean;
}) {
    if (!clinician || !sessionType) {
        return ExcelColours.emptyBrown;
    }

    const isPreReg = clinician.grade_code === "Pre-Reg";
    const isSupervisor = clinician.is_supervisor === true || clinician.is_supervisor === 1;

    if (isPreReg && sessionType === "ST") return ExcelColours.stPreReg;
    if (isPreReg && sessionType === "CL") return ExcelColours.clPreReg;

    if (isSupervisor && hasPreRegOnDay && sessionType === "ST") {
        return ExcelColours.stSupervisor;
    }

    if (isSupervisor && hasPreRegOnDay && sessionType === "CL") {
        return ExcelColours.clSupervisor;
    }

    return ExcelColours.emptyBrown;
}