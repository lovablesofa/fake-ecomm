import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

export default async function CheckEmail({ searchParams }: PageProps<"/login/check-email">) {
  const { email } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl">✉️</p>
      <h1 className="mt-4 font-display text-5xl">Check your email</h1>
      <p className="mt-4 text-muted">
        We sent a sign-in link to <strong className="text-ink">{typeof email === "string" ? email : "your inbox"}</strong>. It expires in 20 minutes.
      </p>
      {!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production" && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dev mode: no RESEND_API_KEY set. Open the <Link href="/dev/outbox" className="font-medium underline">dev outbox</Link> to find the link.
        </p>
      )}
      <Link href="/login" className="mt-8 inline-block text-sm underline underline-offset-4">Use a different email</Link>
    </div>
  );
}
