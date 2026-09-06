import { ServicePage } from "../_service/ServicePage";
export const metadata = { title: "Asset Management" };
export default function Page() {
  return (
    <ServicePage
      eyebrow="Service"
      title="Asset Management"
      intro="Beyond day-to-day management: measuring and improving how your property performs as an asset over time."
      points={[
        ["Property Health Score", "A transparent 0-100 score per property, from occupancy, collection, maintenance, condition, documentation and finance."],
        ["Property Rescue", "A diagnostic that identifies what is holding an underperforming property back, with ranked corrective actions."],
        ["Asset performance", "Rental income, occupancy, vacancy loss, operating expenses, net operating income and estimated yield — with actuals and estimates clearly labelled."],
        ["Portfolio reporting", "Owner reports across your whole portfolio, with filters, date ranges and CSV export."],
        ["Preventive maintenance", "Recurring maintenance scheduled ahead of time to protect condition and value."],
        ["Approvals & control", "Configurable approval thresholds so nothing significant happens without your say-so."],
      ]}
    />
  );
}
