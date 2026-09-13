"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/password/forgot", {
        identifier: identifier.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy-900 p-12 text-navy-100 lg:flex">
        <BrandLockup />
        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-white">
            Forgot your password?
          </h1>
          <p className="mt-4 max-w-md text-navy-200">
            We&apos;ll send a reset link to the email or phone on your account.
          </p>
        </div>
        <p className="text-xs text-navy-300">
          NexaHaus Properties &amp; Asset Management Ltd. · Accra
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLockup />
          </div>

          {sent ? (
            <>
              <h2 className="text-lg font-semibold text-navy-900">
                Check your email
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                If an account exists for {identifier || "that identifier"},
                we&apos;ve sent a link to reset the password. It expires in 60
                minutes.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-medium text-navy-900 hover:underline"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-navy-900">
                Reset your password
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Enter the email or phone number registered with NexaHaus.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-navy-900">
                    Email or phone
                  </span>
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={inputClass}
                  />
                </label>

                {error ? (
                  <p role="alert" className="text-sm text-critical">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" loading={submitting}>
                  Send reset link
                </Button>
              </form>

              <Link
                href="/login"
                className="mt-6 inline-block text-sm text-ink-subtle hover:underline"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-1";
