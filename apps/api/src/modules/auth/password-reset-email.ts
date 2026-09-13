function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function passwordResetEmail(
  fullName: string,
  resetUrl: string,
  ttlMinutes: number,
): { subject: string; text: string; html: string } {
  const greeting = `Hi ${fullName},`;
  const body =
    "We received a request to reset your NexaHaus password. If this was you, use the link below to choose a new one.";
  const expiry = `This link expires in ${ttlMinutes} minutes. If you didn't request this, you can safely ignore this email — your password won't change.`;
  return {
    subject: "Reset your NexaHaus password",
    text: `${greeting}\n\n${body}\n\n${resetUrl}\n\n${expiry}`,
    html: `<!doctype html>
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
              <td style="padding:32px;color:#1a1f2b;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
                <p style="margin:0 0 20px;">${escapeHtml(body)}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                  <tr>
                    <td style="background-color:#0b1f3a;border-radius:8px;">
                      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Reset password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;color:#6b7280;">${escapeHtml(expiry)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
