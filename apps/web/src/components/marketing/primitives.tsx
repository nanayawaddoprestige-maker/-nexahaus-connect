import { cn } from "@/lib/cn";

/** Constrained page-width wrapper with responsive gutters. */
export function Container({
  className,
  children,
  as: As = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return <As className={cn("nx-container", className)}>{children}</As>;
}

type Tone = "default" | "sunken" | "navy";

const TONE: Record<Tone, string> = {
  default: "bg-surface",
  sunken: "bg-surface-sunken",
  navy: "bg-navy-900 text-white",
};

/** A full-bleed vertical band with consistent rhythm. */
export function Section({
  id,
  tone = "default",
  className,
  containerClassName,
  ariaLabel,
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  containerClassName?: string;
  /** aria-label for the section landmark when it has no visible heading. */
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn("py-16 sm:py-20 lg:py-24", TONE[tone], className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({
  children,
  className,
  onNavy = false,
}: {
  children: React.ReactNode;
  className?: string;
  onNavy?: boolean;
}) {
  return (
    <p className={cn("nx-eyebrow", onNavy && "text-gold-400", className)}>
      {children}
    </p>
  );
}

/**
 * Standard section header: eyebrow + display heading + optional lede.
 * `align` centers on request; default is left for editorial feel.
 */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = "left",
  onNavy = false,
  as: Heading = "h2",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  onNavy?: boolean;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow onNavy={onNavy}>{eyebrow}</Eyebrow> : null}
      <Heading
        className={cn(
          "nx-display text-display-lg",
          eyebrow && "mt-3",
          onNavy && "text-white",
        )}
      >
        {title}
      </Heading>
      {lede ? (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            onNavy ? "text-navy-100" : "text-ink-muted",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** Simple bordered content card used across marketing sections. */
export function Card({
  className,
  children,
  as: As = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <As
      className={cn(
        "rounded-xl border border-line bg-surface p-6 shadow-card",
        className,
      )}
    >
      {children}
    </As>
  );
}

/** A labelled figure — used in trust strips and illustrative metrics. */
export function Stat({
  value,
  label,
  hint,
  onNavy = false,
}: {
  value: React.ReactNode;
  label: string;
  hint?: string;
  onNavy?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "text-2xl font-semibold tabular-nums sm:text-3xl",
          onNavy ? "text-white" : "text-navy-900",
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-1 text-sm font-medium",
          onNavy ? "text-navy-100" : "text-ink-muted",
        )}
      >
        {label}
      </div>
      {hint ? (
        <div
          className={cn(
            "mt-0.5 text-xs",
            onNavy ? "text-navy-300" : "text-ink-subtle",
          )}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
