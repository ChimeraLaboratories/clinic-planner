"use client"

type Props = {
    day: number
    roomsFreeText: string;
    previewLines: string[];
    valueText: string;
    onClick?: () => void;
};


export function DayCard({ day, roomsFreeText, previewLines, valueText, onClick }: Props) {
    return (
        <div
            className="bg-white rounded-2xl shadow p-4 h-44 hover:shadow-lg transition cursor-pointer"
            onClick={onClick}
            role="button"
            tabIndex={0}
        >
            {/* Day number + free rooms badge */}
            <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">{day}</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
          {roomsFreeText}
        </span>
            </div>

            {/* Room preview lines */}
            <div className="mt-3 space-y-1 text-sm">
                {previewLines.map((line, i) => (
                    <div key={`${day}-line-${i}`} className={line.includes("Free") ? "text-gray-400" : "text-gray-700"}>
                        {line}
                    </div>
                ))}
            </div>

            {/* Clinical value total */}
            <div className="mt-4 text-sm font-medium text-blue-600">{valueText}</div>
        </div>
    );
}