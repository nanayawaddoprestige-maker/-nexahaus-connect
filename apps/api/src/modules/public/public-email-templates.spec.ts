import {
  contactConfirmationEmail,
  earlyAccessConfirmationEmail,
  propertyHealthCheckConfirmationEmail,
  propertyOwnerSurveyConfirmationEmail,
  propertyRescueConfirmationEmail,
} from "./public-email-templates";

describe("public-email-templates", () => {
  it("early access: names the right programme per campaign", () => {
    expect(
      earlyAccessConfirmationEmail({ name: "Ama", campaign: "FOUNDING_100" })
        .subject,
    ).toContain("Founding 100");
    expect(
      earlyAccessConfirmationEmail({ name: "Ama", campaign: "EARLY_ACCESS" })
        .subject,
    ).toContain("Early Access");
  });

  it("health check and property rescue include the score and readable band", () => {
    const hc = propertyHealthCheckConfirmationEmail({
      name: "Kwame",
      score: 72,
      band: "NEEDS_ATTENTION",
    });
    expect(hc.text).toContain("72/100");
    expect(hc.text).toContain("needs attention");

    const pr = propertyRescueConfirmationEmail({
      name: "Kwame",
      score: 40,
      band: "AT_RISK",
    });
    expect(pr.text).toContain("40/100");
    expect(pr.text).toContain("at risk");
  });

  it("survey and contact confirmations greet the submitter by name", () => {
    expect(
      propertyOwnerSurveyConfirmationEmail({ name: "Esi" }).text,
    ).toContain("Hi Esi,");
    expect(contactConfirmationEmail({ name: "Esi" }).text).toContain("Hi Esi,");
  });

  it("escapes HTML in user-supplied names so a submitted name can't inject markup", () => {
    const malicious = '<img src=x onerror=alert(1)> "Ama" O\'Brien';
    const { html } = contactConfirmationEmail({ name: malicious });
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&quot;Ama&quot; O&#39;Brien");
  });

  it("every template returns a non-empty subject, text and html body", () => {
    const templates = [
      earlyAccessConfirmationEmail({ name: "Ama", campaign: "OWNER_CLUB" }),
      propertyOwnerSurveyConfirmationEmail({ name: "Ama" }),
      propertyHealthCheckConfirmationEmail({
        name: "Ama",
        score: 90,
        band: "HEALTHY",
      }),
      propertyRescueConfirmationEmail({
        name: "Ama",
        score: 90,
        band: "HEALTHY",
      }),
      contactConfirmationEmail({ name: "Ama" }),
    ];
    for (const t of templates) {
      expect(t.subject.length).toBeGreaterThan(0);
      expect(t.text.length).toBeGreaterThan(0);
      expect(t.html).toContain("<!doctype html>");
      expect(t.html).toContain("NexaHaus");
    }
  });
});
