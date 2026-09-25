import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-display text-5xl">Sign in</h1>
      <p className="mt-3 text-muted">
        {next === "/checkout"
          ? "Almost there. Sign in so we can send your order confirmation and tracking updates."
          : "We'll email you a link to sign in. No password needed."}
      </p>
      {params.error === "expired" && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          That sign-in link has expired or was already used. Request a new one below.
        </p>
      )}
      <LoginForm next={next} />
    </div>
  );
}
