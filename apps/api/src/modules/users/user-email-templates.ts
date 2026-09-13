/**
 * Transactional emails for staff account lifecycle (invite). Same
 * table-based, inline-style layout as public-email-templates.ts, kept
 * separate since these address internal users, not marketing leads.
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const BRAND = { name: "NexaHaus" } as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#0b1f3a;padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.02em;">${BRAND.name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1a1f2b;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f4f5f7;color:#6b7280;font-size:12px;line-height:1.5;">
                This is an internal ${BRAND.name} account notification.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;">${escapeHtml(text)}</p>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr>
      <td style="background-color:#0b1f3a;border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function staffInviteEmail(input: {
  fullName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresInHours: number;
}): EmailTemplate {
  const greeting = `Hi ${input.fullName},`;
  const body = `You've been invited to join the ${BRAND.name} team as ${input.roleLabel}. Set your password to activate your account.`;
  const expiry = `This link expires in ${input.expiresInHours} hours.`;
  return {
    subject: `You're invited to ${BRAND.name}`,
    text: `${greeting}\n\n${body}\n\n${input.inviteUrl}\n\n${expiry}`,
    html: layout(
      `Join ${BRAND.name}`,
      paragraph(greeting) +
        paragraph(body) +
        button(input.inviteUrl, "Set your password") +
        paragraph(expiry),
    ),
  };
}
