"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitFeedback } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

const KINDS = [
  { value: "idea", label: "An idea" },
  { value: "problem", label: "Something's broken" },
  { value: "other", label: "Something else" },
];

export function FeedbackForm({ email }: { email: string }) {
  const [state, action] = useActionState(submitFeedback, undefined);

  if (state?.ok) {
    return (
      <div className="mt-10 rounded-2xl bg-accent-soft p-8 text-center">
        <p className="font-display text-3xl text-accent">Thank you.</p>
        <p className="mt-2 text-muted">Got it. If you asked something, we&apos;ll reply by email.</p>
        <Link href="/shop" className="btn-primary mt-6">Back to the shop</Link>
      </div>
    );
  }

  const values = state?.values;
  return (
    <form action={action} className="mt-10 space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm text-muted">What&apos;s it about?</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <label key={k.value}>
              <input type="radio" name="kind" value={k.value} defaultChecked={(values?.kind ?? "idea") === k.value} className="peer sr-only" />
              <span className="inline-block cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:ring-1 peer-checked:ring-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {k.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Your message</span>
        <textarea name="message" required minLength={5} maxLength={2000} rows={6} defaultValue={values?.message} className="input resize-y" placeholder="What would make this better?" />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Email, so we can reply</span>
        <input type="email" name="email" required autoComplete="email" defaultValue={values?.email ?? email} className="input" placeholder="you@example.com" />
      </label>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <SubmitButton pendingText="Sending…" className="btn-primary w-full sm:w-auto">Send feedback</SubmitButton>
    </form>
  );
}
