import ActivitySummaryCard from "./ActivitySummaryCard";
import ComplianceAlertsCard from "./ComplianceAlertsCard";
import DayRulesSummaryCard from "./DayRulesSummaryCard";
import GocRegistrationCard from "./GocRegistrationCard";
import LatestActivityCard from "./LatestActivityCard";
import RegistrationsAccreditationsCard from "./RegistrationsAccreditationsCard";

/**
 * Main overview layout for the clinician profile.
 * This keeps the page structure separate from the individual card logic.
 */
export default function OverviewGrid() {
    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                <GocRegistrationCard />
                <ComplianceAlertsCard />
            </div>

            <RegistrationsAccreditationsCard />

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <ActivitySummaryCard />
                <DayRulesSummaryCard />
            </div>

            <LatestActivityCard />
        </div>
    );
}