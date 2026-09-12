import { computeLeadScore } from "./lead-scoring.util";
import { LeadGrade } from "@nexahaus/types";

describe("computeLeadScore (spec §74)", () => {
  it("a cold enquiry with nothing on file scores D", () => {
    const res = computeLeadScore({ propertyCount: 1 });
    expect(res.score).toBe(5); // one property band only
    expect(res.grade).toBe(LeadGrade.D);
  });

  it("a diaspora owner of several properties who has done an assessment scores A", () => {
    const res = computeLeadScore({
      propertyCount: 4,
      livesInGhana: false,
      biggestChallenge: "No reporting from my caretaker",
      assessmentCompleted: true,
      consultationBooked: true,
      engagementTouches: 3,
    });
    // 20 + 15 + 15 + 20 + 20 + 6 = 96
    expect(res.score).toBe(96);
    expect(res.grade).toBe(LeadGrade.A);
  });

  it("infers diaspora from a non-Ghana location when the flag is missing", () => {
    const withUK = computeLeadScore({
      propertyCount: 2,
      location: "London, UK",
    });
    const withAccra = computeLeadScore({
      propertyCount: 2,
      location: "Accra, Ghana",
    });
    expect(withUK.score).toBeGreaterThan(withAccra.score);
    expect(withUK.breakdown.some((b) => b.factor === "diaspora")).toBe(true);
    expect(withAccra.breakdown.some((b) => b.factor === "diaspora")).toBe(
      false,
    );
  });

  it("caps engagement at its configured weight", () => {
    const res = computeLeadScore({ engagementTouches: 50 });
    expect(res.breakdown.find((b) => b.factor === "engagement")?.points).toBe(
      10,
    );
  });

  it("is deterministic and respects overridden grade thresholds", () => {
    const inputs = { propertyCount: 2, assessmentCompleted: true }; // 12 + 20 = 32
    const strict = computeLeadScore(inputs, {
      grades: { A: 90, B: 70, C: 40, D: 0 },
    });
    const lenient = computeLeadScore(inputs, {
      grades: { A: 30, B: 20, C: 10, D: 0 },
    });
    expect(strict.grade).toBe(LeadGrade.D);
    expect(lenient.grade).toBe(LeadGrade.A);
    expect(strict.score).toBe(lenient.score);
  });

  it("clamps the raw total to 0..100", () => {
    const res = computeLeadScore({
      propertyCount: 10,
      livesInGhana: false,
      biggestChallenge: "everything",
      assessmentCompleted: true,
      consultationBooked: true,
      engagementTouches: 20,
    });
    expect(res.score).toBeLessThanOrEqual(100);
  });
});
