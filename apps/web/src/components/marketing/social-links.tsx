import { cn } from "@/lib/cn";
import { SOCIAL } from "@/lib/site-config";

type Platform = keyof typeof SOCIAL;

const LABELS: Record<Platform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const PATHS: Record<Platform, string> = {
  linkedin:
    "M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C21.4 8.65 22 11 22 14.3V21h-4v-5.9c0-1.4-.02-3.2-1.95-3.2-1.96 0-2.26 1.53-2.26 3.1V21h-4z",
  instagram:
    "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23a3.7 3.7 0 01-.9 1.38 3.7 3.7 0 01-1.38.9c-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.42 2.21 8.8 2.2 12 2.2zm0 3.05A6.75 6.75 0 1012 18.75 6.75 6.75 0 0012 5.25zm0 11.14a4.39 4.39 0 110-8.78 4.39 4.39 0 010 8.78zM19.85 5a1.58 1.58 0 11-3.15 0 1.58 1.58 0 013.15 0z",
  facebook:
    "M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z",
  tiktok:
    "M16.5 3c.3 2.1 1.5 3.6 3.5 3.8v2.6c-1.3.1-2.5-.3-3.6-1v6.6c0 3.5-2.5 6.4-6 6.4-3.3 0-5.9-2.6-5.9-5.9 0-3.4 2.9-6.1 6.4-5.7v2.7c-.4-.1-.9-.2-1.3-.2-1.7 0-3 1.4-3 3.1 0 1.7 1.3 3.1 3 3.1 1.7 0 3-1.3 3-3.1V3z",
  youtube:
    "M23 12s0-3.2-.4-4.7a3 3 0 00-2.1-2.1C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.5.4A3 3 0 001.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a3 3 0 002.1 2.1c1.6.4 8.5.4 8.5.4s6.9 0 8.5-.4a3 3 0 002.1-2.1C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z",
};

/**
 * Renders only the profiles that have a configured URL (brief §34: never invent
 * social URLs).
 */
export function SocialLinks({
  className,
  onNavy = false,
}: {
  className?: string;
  onNavy?: boolean;
}) {
  const entries = (Object.keys(SOCIAL) as Platform[]).filter((k) => SOCIAL[k]);
  if (entries.length === 0) return null;

  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {entries.map((k) => (
        <li key={k}>
          <a
            href={SOCIAL[k]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${LABELS[k]} (opens in a new tab)`}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2",
              onNavy
                ? "text-navy-200 hover:bg-white/10 hover:text-white focus-visible:ring-white"
                : "text-ink-subtle hover:bg-surface-sunken hover:text-navy-900 focus-visible:ring-navy-500",
            )}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d={PATHS[k]} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
