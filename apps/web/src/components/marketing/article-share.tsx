"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

/** Share intents for an Insights article — WhatsApp, LinkedIn, X, and copy link.
 *  No SDKs: plain share-intent URLs, same pattern as `WhatsAppButton`. */
export function ArticleShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("cta_clicked", { label: "Copy link", location: "insight_share" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the visible links still work.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6 text-sm">
      <span className="font-medium text-navy-800">Share this guide:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("cta_clicked", { label: `Share on ${l.label}`, location: "insight_share" })}
          className="text-ink-muted underline underline-offset-2 hover:text-navy-900"
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="text-ink-muted underline underline-offset-2 hover:text-navy-900"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
