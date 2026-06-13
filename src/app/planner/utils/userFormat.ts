export function formatUserDate(value: string | Date, dateFormat = "dd/MM/yyyy") {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    if (dateFormat === "MM/dd/yyyy") return date.toLocaleDateString("en-US");
    if (dateFormat === "yyyy-MM-dd") return date.toISOString().slice(0, 10);

    return date.toLocaleDateString("en-GB");
}

export function formatUserTime(value: string | Date, timeFormat = "HH:mm") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: timeFormat === "h:mm a",
    });
}