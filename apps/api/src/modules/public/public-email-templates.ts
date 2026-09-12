/**
 * Confirmation emails for the five public lead-capture endpoints (Phase 6,
 * docs/WEBSITE_IMPLEMENTATION_PLAN.md). Every template returns plain text +
 * a branded HTML body; the active `EmailAdapter` decides what it does with
 * each (the console adapter used until a real provider is configured logs
 * both). No claims beyond what the platform actually does — these confirm
 * receipt, they never promise a timeline the business hasn't committed to.
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const BRAND = {
  name: "NexaHaus",
  legalName: "NexaHaus Properties & Asset Management Ltd.",
  tagline: "Managing Properties. Maximizing Assets.",
} as const;

/** Shared branded shell — table-based layout, inline styles only, for email
 *  client compatibility. Keep markup simple; no external assets. */
function layout(preheader: string, title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#0b1f3a;padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.02em;">${BRAND.name}</span>
                <div style="color:#c9a24b;font-size:12px;margin-top:2px;">${BRAND.tagline}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1a1f2b;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f4f5f7;color:#6b7280;font-size:12px;line-height:1.5;">
                ${escapeHtml(BRAND.legalName)}. This is a transactional confirmation of a form you submitted on the NexaHaus website — not marketing.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;">${escapeHtml(text)}</p>`;
}

export function earlyAccessConfirmationEmail(input: {
  name: string;
  campaign: "FOUNDING_100" | "EARLY_ACCESS" | "OWNER_CLUB";
}): EmailTemplate {
  const programme =
    input.campaign === "FOUNDING_100" ? "Founding 100" : "Early Access";
  const greeting = `Hi ${input.name},`;
  const body =
    `Thank you for joining the NexaHaus ${programme} list. We're building NexaHaus Connect and ` +
    `shaping our services around real property owners in Ghana and the diaspora — you'll be among ` +
    `the first to hear from us before launch.`;
  return {
    subject: `You're on the NexaHaus ${programme} list`,
    text: `${greeting}\n\n${body}\n\n— ${BRAND.name}`,
    html: layout(
      body,
      `Welcome to ${BRAND.name} ${programme}`,
      paragraph(greeting) +
        paragraph(body) +
        paragraph(`— The ${BRAND.name} team`),
    ),
  };
}

export function propertyOwnerSurveyConfirmationEmail(input: {
  name: string;
}): EmailTemplate {
  const greeting = `Hi ${input.name},`;
  const body =
    "Thank you for completing the NexaHaus Property Owner Survey. Your answers help us build " +
    "NexaHaus around what property owners in Ghana actually need — we read every response.";
  return {
    subject: "Thank you for your NexaHaus survey response",
    text: `${greeting}\n\n${body}\n\n— ${BRAND.name}`,
    html: layout(
      body,
      "Thank you for your response",
      paragraph(greeting) +
        paragraph(body) +
        paragraph(`— The ${BRAND.name} team`),
    ),
  };
}

export function propertyHealthCheckConfirmationEmail(input: {
  name: string;
  score: number;
  band: string;
}): EmailTemplate {
  const greeting = `Hi ${input.name},`;
  const body =
    `Thank you for completing the NexaHaus Property Health Check. Your preliminary score was ` +
    `${input.score}/100 (${input.band.replace(/_/g, " ").toLowerCase()}).`;
  const disclaimer =
    "This is a preliminary digital assessment based on your own answers — it is not a professional " +
    "property assessment or valuation. A member of the NexaHaus team will follow up about a full assessment.";
  return {
    subject: "Your NexaHaus Property Health Check result",
    text: `${greeting}\n\n${body}\n\n${disclaimer}\n\n— ${BRAND.name}`,
    html: layout(
      body,
      "Your Property Health Check result",
      paragraph(greeting) +
        paragraph(body) +
        paragraph(disclaimer) +
        paragraph(`— The ${BRAND.name} team`),
    ),
  };
}

export function propertyRescueConfirmationEmail(input: {
  name: string;
  score: number;
  band: string;
}): EmailTemplate {
  const greeting = `Hi ${input.name},`;
  const body =
    `Thank you for completing the NexaHaus Property Rescue diagnostic. Your preliminary score was ` +
    `${input.score}/100 (${input.band.replace(/_/g, " ").toLowerCase()}).`;
  const disclaimer =
    "This preliminary result is an indicative management assessment — it does not constitute a " +
    "professional property valuation, legal advice or investment advice. A member of the NexaHaus " +
    "team will follow up about a full assessment.";
  return {
    subject: "Your NexaHaus Property Rescue result",
    text: `${greeting}\n\n${body}\n\n${disclaimer}\n\n— ${BRAND.name}`,
    html: layout(
      body,
      "Your Property Rescue result",
      paragraph(greeting) +
        paragraph(body) +
        paragraph(disclaimer) +
        paragraph(`— The ${BRAND.name} team`),
    ),
  };
}

export function contactConfirmationEmail(input: {
  name: string;
}): EmailTemplate {
  const greeting = `Hi ${input.name},`;
  const body =
    "Thank you for contacting NexaHaus. Your enquiry has been received and a member of the team " +
    "will get back to you.";
  return {
    subject: "We've received your enquiry — NexaHaus",
    text: `${greeting}\n\n${body}\n\n— ${BRAND.name}`,
    html: layout(
      body,
      "We've received your enquiry",
      paragraph(greeting) +
        paragraph(body) +
        paragraph(`— The ${BRAND.name} team`),
    ),
  };
}
