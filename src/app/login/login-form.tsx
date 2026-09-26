"use client";

import { useActionState, useState } from "react";
import { requestLoginLink } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(requestLoginLink, undefined);
  // Controlled, so a rejected address stays in the box instead of being wiped by the form reset.
  const [email, setEmail] = useState("");
  return (
    // noValidate: the server checks the address and answers in English; browser bubbles follow the OS language.
    <form action={action} noValidate className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Email</span>
        <input type="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus className="input" placeholder="you@example.com" />
      </label>
      {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <SubmitButton pendingText="Sending link…" className="btn-primary w-full">Email me a sign-in link</SubmitButton>
    </form>
  );
}
