import {
  contactEnquirySchema,
  earlyAccessSchema,
  propertyHealthCheckSchema,
  propertyOwnerSurveySchema,
  propertyRescueSchema,
} from "@nexahaus/validation";

/**
 * The `honeypot` field on every public lead-capture schema is the server-side
 * half of the anti-bot defence (components/forms/fields.tsx's `Honeypot` is
 * the client-side half, which only stops bots that execute the page's JS —
 * see the commit that added this). A bot that POSTs straight to the API and
 * fills every field it finds must be rejected; a real submitter, who never
 * sees the field, must not be.
 */
describe("public schema honeypot field", () => {
  const consent = { marketing: true as const, wording: "I agree to be contacted." };

  const cases: Array<[string, unknown, unknown]> = [
    [
      "propertyHealthCheckSchema",
      propertyHealthCheckSchema,
      {
        contactName: "Ama Owusu",
        email: "ama@example.com",
        phone: "+233201234567",
        livesInGhana: true,
        answers: {
          occupied: true,
          managedProfessionally: false,
          tenantsPayOnTime: "USUALLY",
          inspectionFrequency: "YEARLY",
          receivesFinancialReports: false,
          documentsInOrder: true,
          lastMaintenanceRecent: true,
        },
        consent,
      },
    ],
    [
      "earlyAccessSchema",
      earlyAccessSchema,
      { name: "Ama Owusu", email: "ama@example.com", phone: "+233201234567", consent },
    ],
    [
      "contactEnquirySchema",
      contactEnquirySchema,
      {
        name: "Ama Owusu",
        email: "ama@example.com",
        phone: "+233201234567",
        message: "I'd like to discuss management of my property.",
        consent,
      },
    ],
    [
      "propertyRescueSchema",
      propertyRescueSchema,
      {
        name: "Ama Owusu",
        email: "ama@example.com",
        phone: "+233201234567",
        ownerLocation: "GHANA",
        answers: {
          occupancy: "FULLY_OCCUPIED",
          rentVsMarket: "AT",
          collectionReliability: "USUALLY",
          arrears: false,
          maintenanceBacklog: "NONE",
          conditionConcerns: false,
          lastInspection: "WITHIN_3M",
          documentsInOrder: true,
          professionallyManaged: true,
          knowsExpenses: true,
        },
        consent,
      },
    ],
    [
      "propertyOwnerSurveySchema",
      propertyOwnerSurveySchema,
      {
        name: "Ama Owusu",
        email: "ama@example.com",
        phone: "+233201234567",
        answers: { q1: "yes" },
        consent,
      },
    ],
  ];

  it.each(cases)("%s accepts a real submission with no honeypot value", (_name, schema, base) => {
    expect((schema as { safeParse: (v: unknown) => { success: boolean } }).safeParse(base).success).toBe(
      true,
    );
  });

  it.each(cases)("%s accepts an explicit empty-string honeypot", (_name, schema, base) => {
    const withEmpty = { ...(base as Record<string, unknown>), honeypot: "" };
    expect(
      (schema as { safeParse: (v: unknown) => { success: boolean } }).safeParse(withEmpty).success,
    ).toBe(true);
  });

  it.each(cases)("%s rejects a bot-filled honeypot", (_name, schema, base) => {
    const withBot = { ...(base as Record<string, unknown>), honeypot: "https://spam.example" };
    expect(
      (schema as { safeParse: (v: unknown) => { success: boolean } }).safeParse(withBot).success,
    ).toBe(false);
  });
});
