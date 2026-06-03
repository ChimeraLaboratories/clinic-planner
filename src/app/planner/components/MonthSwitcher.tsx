import { formatMonthTitle } from "../utils/date";

export default function MonthSwitcher({
                                          anchorMonth,
                                          onPrevMonth,
                                          onNextMonth,
                                          onCurrentMonth,
                                      }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onCurrentMonth: () => void;
}) {
    const today = new Date();

    const isCurrentMonth =
        today.getMonth() === anchorMonth.getMonth() &&
        today.getFullYear() === anchorMonth.getFullYear();

    return (
        <div className="flex items-center gap-2">
            <button onClick={onPrevMonth}>‹</button>

            <div className="font-semibold">
                {formatMonthTitle(anchorMonth)}
            </div>

            <button onClick={onNextMonth}>›</button>

            {!isCurrentMonth && (
                <button onClick={onCurrentMonth}>
                    Current Month
                </button>
            )}
        </div>
    );
}