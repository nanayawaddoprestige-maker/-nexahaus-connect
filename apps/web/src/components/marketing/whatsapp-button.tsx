"use client";

import { WHATSAPP_LINK } from "@/lib/site-config";
import { track } from "@/lib/analytics";

/**
 * Floating "Chat With NexaHaus" action. Renders nothing until an official
 * WhatsApp number is configured (brief §28: never invent a number).
 */
export function WhatsAppButton() {
  if (!WHATSAPP_LINK) return null;
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        track("cta_clicked", {
          label: "Chat With NexaHaus",
          location: "floating",
        })
      }
      className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-3 text-sm font-semibold text-white shadow-raised transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
      aria-label="Chat with NexaHaus on WhatsApp (opens in a new tab)"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.1.55 4.06 1.6 5.83L2 22l4.4-1.15a9.86 9.86 0 004.64 1.18h.01c5.46 0 9.91-4.45 9.91-9.91C20.96 6.45 16.5 2 12.04 2zm5.8 14.06c-.25.7-1.44 1.33-1.99 1.36-.53.05-1.03.24-3.46-.72-2.92-1.15-4.78-4.14-4.92-4.33-.14-.19-1.17-1.56-1.17-2.98 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36l.55.01c.18.01.42-.07.65.5.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.19.73-.85.93-1.14.19-.29.39-.24.65-.15.26.1 1.65.78 1.94.92.29.15.48.22.55.34.07.12.07.72-.18 1.42z" />
      </svg>
      Chat With NexaHaus
    </a>
  );
}
