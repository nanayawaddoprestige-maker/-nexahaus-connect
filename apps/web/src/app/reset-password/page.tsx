"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/password/reset", { token, password });
      setDone(true);
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
            Choose a new password.
          </h1>
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

          {!token ? (
            <p className="text-sm text-critical">
              This reset link is missing its token. Request a new one from the
              sign-in page.
            </p>
          ) : done ? (
            <>
              <h2 className="text-lg font-semibold text-navy-900">
                Password updated
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Sign in with your new password. You&apos;ve been signed out
                everywhere else for safety.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => router.push("/login")}
              >
                Go to sign in
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-navy-900">
                Set a new password
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                At least 12 characters, with an uppercase letter, a lowercase
                letter and a digit.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-navy-900">
                    New password
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-navy-900">
                    Confirm new password
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                  />
                </label>

                {error ? (
                  <p role="alert" className="text-sm text-critical">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" loading={submitting}>
                  Reset password
                </Button>
              </form>
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
