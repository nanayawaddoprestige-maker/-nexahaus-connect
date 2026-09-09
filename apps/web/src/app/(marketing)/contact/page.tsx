export const metadata = { title: "Contact NexaHaus" };
export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-3xl font-semibold text-navy-900">Contact</h1>
      <p className="mt-4 text-ink-muted">
        NexaHaus Properties &amp; Asset Management Ltd. — first office opening in
        Accra, December 2027.
      </p>
      <p className="mt-4 text-sm text-ink-muted">
        The fastest way to reach us before launch is the
        {" "}<a className="font-medium text-navy-700 underline" href="/health-check">Property Health Check</a>{" "}
        or <a className="font-medium text-navy-700 underline" href="/early-access">Early Access</a> form —
        both come straight to our team.
      </p>
    </div>
  );
}
