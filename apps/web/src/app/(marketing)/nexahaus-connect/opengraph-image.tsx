import { renderOgImage, OG_SIZE } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "NexaHaus Connect";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return renderOgImage(
    "NexaHaus Connect",
    "Your Property. Your Data. Your Control.",
  );
}
