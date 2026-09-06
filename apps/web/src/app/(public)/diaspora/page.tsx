import { ServicePage } from "../_service/ServicePage";
export const metadata = { title: "Diaspora Property Management" };
export default function Page() {
  return (
    <ServicePage
      eyebrow="For owners abroad"
      title="Own property in Ghana while living abroad"
      intro="Stay informed without being physically present. NexaHaus is designed for owners who don't live near their property — so you can manage it from another country."
      points={[
        ["See what's happening", "Property status, latest inspection, latest photos, tenant status, rent collection, maintenance, expenses and documents — in one place."],
        ["Clear dates", "\"Last inspected: 3 September\". \"Last rent received: 1 September\". \"Last maintenance: 27 August\". No guessing."],
        ["Fewer phone calls", "The dashboard answers the basic questions, so you don't need to call or WhatsApp for a status update."],
        ["Approvals from anywhere", "Review photos and costs and approve or decline maintenance from your phone."],
        ["Monthly statements", "A branded statement each month, viewable online or as a PDF, reproducible from every transaction."],
        ["Multi-currency ready", "Figures in GHS today, with multi-currency support planned as the platform grows."],
      ]}
    />
  );
}
