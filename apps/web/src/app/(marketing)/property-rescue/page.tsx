import { ServicePage } from "../_service/ServicePage";
export const metadata = { title: "Property Rescue" };
export default function Page() {
  return (
    <ServicePage
      eyebrow="Service"
      title="Property Rescue"
      intro="A preliminary desk assessment for a property that is underperforming — what's wrong, and what to do about it."
      points={[
        ["Diagnosis", "We examine occupancy, rental pricing, vacancy, rent collection, maintenance backlog, condition, documentation and revenue leakage."],
        ["A clear score", "An overall Property Rescue score out of 100, with the specific problems identified."],
        ["Ranked actions", "A prioritised list of corrective actions — pricing, maintenance, tenant management, preventive maintenance, documentation."],
        ["A written report", "A branded PDF you can keep and act on."],
        ["Follow-through", "If you appoint NexaHaus, we work through the actions and re-assess."],
        ["Honest limits", "This is a preliminary desk assessment from available data — not a professional valuation or structural survey."],
      ]}
    />
  );
}
