"use client";

import { useActionState } from "react";
import { requestLoginLink } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(requestLoginLink, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Email</span>
        <input type="email" name="email" required autoComplete="email" autoFocus className="input" placeholder="you@example.com" />
      </label>
      {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <SubmitButton pendingText="Sending link…" className="btn-primary w-full">Email me a sign-in link</SubmitButton>
    </form>
  );
}
