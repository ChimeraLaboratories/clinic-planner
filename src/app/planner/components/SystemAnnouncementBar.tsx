export default function SystemAnnouncementBar() {
    const message =
        "We are aware that the Export to Excel button may not work as intended. This is being looked at by the Development Team.";

    if (!message) return null;

    return (
        <div className="w-full bg-yellow-400 border-b border-yellow-500 text-black">
            <div className="px-4 py-2 text-center text-sm font-semibold">
                {message}
            </div>
        </div>
    );
}