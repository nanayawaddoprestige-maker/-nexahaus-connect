"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { homePathForUser } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";

export default function LoginPage() {
  const router = useRouter();
  const { status, user, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(homePathForUser(user));
  }, [status, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(
        identifier.trim(),
        password,
        mfaCode || undefined,
      );
      if (result.mfaRequired) {
        setMfaRequired(true);
      } else {
        router.replace(homePathForUser(result.user));
      }
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
            Know exactly what is happening with your property — wherever you
            are.
          </h1>
          <p className="mt-4 max-w-md text-navy-200">
            Status, tenants, rent, maintenance, inspections, documents and
            performance for every property in your portfolio, in one secure
            place.
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
          <h2 className="text-lg font-semibold text-navy-900">Sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Use the email or phone number registered with NexaHaus.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Email or phone">
              <input
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            {mfaRequired ? (
              <Field label="Authentication code">
                <input
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, ""))
                  }
                  className={inputClass}
                  placeholder="6-digit code"
                />
              </Field>
            ) : null}

            {error ? (
              <p role="alert" className="text-sm text-critical">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" loading={submitting}>
              {mfaRequired ? "Verify and continue" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-xs text-ink-subtle">
            Trouble signing in? Contact your NexaHaus property manager.
          </p>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-1";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy-900">
        {label}
      </span>
      {children}
    </label>
  );
}
