import { renderOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "NexaHaus for Diaspora Property Owners";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return renderOgImage("Diaspora", "Own Property in Ghana. Stay Connected From Anywhere.");
}
