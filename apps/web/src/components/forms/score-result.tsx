import { HealthGauge } from "@/components/marketing/health-gauge";
import { Cta } from "@/components/marketing/cta";
import { routes } from "@/lib/routes";
import type { AnalyticsEvent } from "@/lib/analytics";

/**
 * Shared outcome screen for the Property Health Check and Property Rescue flows:
 * the indicative score, what it means, the disclaimer, and the next step.
 */
export function ScoreResult({
  score,
  headline,
  body,
  disclaimer,
  primary = {
    label: "Request a professional assessment",
    href: routes.contact,
  },
  primaryEvent = "assessment_requested",
  breakdown,
}: {
  score: number;
  headline: string;
  body?: string;
  disclaimer: string;
  primary?: { label: string; href: string };
  primaryEvent?: AnalyticsEvent;
  /** Optional per-area notes to show under the score. */
  breakdown?: { area: string; note: string }[];
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Your indicative score
      </p>
      <div className="mt-4 flex justify-center">
        <HealthGauge score={score} size={220} />
      </div>
      <p className="mt-4 text-lg font-semibold text-navy-900">{headline}</p>
      {body ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{body}</p>
      ) : null}

      {breakdown && breakdown.length > 0 ? (
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
          {breakdown.map((b) => (
            <li
              key={b.area}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              <span className="font-medium text-navy-900">{b.area}:</span>{" "}
              <span className="text-ink-muted">{b.note}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mx-auto mt-6 max-w-md text-xs text-ink-subtle">
        {disclaimer}
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Cta
          href={primary.href}
          size="lg"
          event={primaryEvent}
          eventProps={{ location: "score_result" }}
        >
          {primary.label}
        </Cta>
        <Cta href={routes.home} variant="secondary" size="lg">
          Back to home
        </Cta>
      </div>
    </div>
  );
}
