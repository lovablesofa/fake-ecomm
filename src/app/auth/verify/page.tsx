import type { Metadata } from "next";
import { verifyLogin } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

// The link lands on a confirm button instead of signing in on GET, so email
// scanners that prefetch links don't burn the one-time token.
export default async function VerifyPage({ searchParams }: PageProps<"/auth/verify">) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-5xl">Welcome back</h1>
      <p className="mt-4 text-muted">Continue to sign in to {BRAND.name}.</p>
      <form action={verifyLogin} className="mt-8">
        <input type="hidden" name="token" value={typeof token === "string" ? token : ""} />
        <SubmitButton pendingText="Signing in…" className="btn-primary w-full">Continue</SubmitButton>
      </form>
    </div>
  );
}
