import type { OtpPurpose } from "@nexahaus/types";

const PURPOSE_COPY: Record<OtpPurpose, string> = {
  VERIFY_EMAIL: "Verify your email to finish setting up your NexaHaus account.",
  VERIFY_PHONE: "Verify your phone to finish setting up your NexaHaus account.",
  LOGIN_MFA: "Use this code to finish signing in to NexaHaus.",
  PASSWORD_RESET: "Use this code to reset your NexaHaus password.",
};

export function otpEmail(
  code: string,
  purpose: OtpPurpose,
  ttlMinutes: number,
): { subject: string; text: string; html: string } {
  const intro = PURPOSE_COPY[purpose];
  const text = `${intro}\n\nYour code: ${code}\n\nThis code expires in ${ttlMinutes} minutes. If you didn't request this, you can ignore this email.`;
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#0b1f3a;padding:20px 32px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.02em;">NexaHaus</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1a1f2b;font-size:15px;line-height:1.6;text-align:center;">
                <p style="margin:0 0 20px;">${escapeHtml(intro)}</p>
                <p style="margin:0 0 20px;font-size:32px;font-weight:bold;letter-spacing:0.15em;color:#0b1f3a;">${escapeHtml(code)}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">Expires in ${ttlMinutes} minutes. If you didn't request this, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { subject: "Your NexaHaus verification code", text, html };
}

export function otpSms(
  code: string,
  purpose: OtpPurpose,
  ttlMinutes: number,
): string {
  return `NexaHaus: ${PURPOSE_COPY[purpose]} Code: ${code} (expires in ${ttlMinutes} min).`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
