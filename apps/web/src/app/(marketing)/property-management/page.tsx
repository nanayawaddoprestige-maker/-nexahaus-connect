import { ServicePage } from "../_service/ServicePage";
export const metadata = { title: "Property Management" };
export default function Page() {
  return (
    <ServicePage
      eyebrow="Service"
      title="Property Management"
      intro="Day-to-day management of your property and tenants, with transparent reporting you can see any time — occupancy, rent, maintenance, inspections and documents."
      points={[
        ["Tenants & leases", "Tenant records, lease management, renewal and expiry reminders, and a professional channel for tenant communication."],
        ["Rent & collection", "Rent tracking, receipts, and clear monthly figures for what was expected, collected and outstanding."],
        ["Maintenance", "Issues tracked from report to completion, with photos, vendor assignment and your approval for costs above your threshold."],
        ["Inspections", "Scheduled inspections with area-by-area findings, photos and a branded report."],
        ["Documents", "Secure storage for title, tenancy, insurance and inspection documents, with expiry reminders."],
        ["Owner statements", "Monthly statements reproducible from every transaction — nothing edited by hand."],
      ]}
    />
  );
}
