export type AlertSeverity = "critical" | "warning" | "info";

export type AlertType =
    | "ROOM_OVERBOOKING"
    | "MISSING_CLINICIAN"
    | "UNSUPERVISED_PREREG"
    | "EMPTY_CLINIC"
    | "LOW_ST_VALUE"
    | "TRAINING_WEEKEND";

export type PlannerAlert = {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    target_date: string;
    time_label?: string;
    status: "active" | "resolved";
};