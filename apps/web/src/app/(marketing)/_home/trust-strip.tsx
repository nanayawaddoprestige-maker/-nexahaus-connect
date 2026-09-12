import { Container } from "@/components/marketing/primitives";
import { trustStrip } from "./content";

/**
 * Quiet capability strip (brief §6). Statements of what NexaHaus does — no
 * certifications, awards or client counts.
 */
export function TrustStrip() {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="py-6">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {trustStrip.map((item) => (
            <li key={item.label}>
              <p className="text-sm font-semibold text-navy-900">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-ink-subtle">{item.caption}</p>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
