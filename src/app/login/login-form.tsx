"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestLoginLink, verifyLoginCode } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

/** Email, then a 6-digit code typed on the same page: nobody has to leave the tab to sign in. */
export function LoginForm({ next, submitLabel = "Email me a code" }: { next: string; submitLabel?: string }) {
  const [sent, send] = useActionState(requestLoginLink, undefined);
  const [checked, check] = useActionState(verifyLoginCode, undefined);
  // Controlled, so a rejected address stays in the box instead of being wiped by the form reset.
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState(false);

  if (sent?.sentTo && !editing) {
    return (
      <div className="mt-8">
        <p className="text-sm text-muted">
          We sent a 6-digit code to <strong className="text-ink">{sent.sentTo}</strong>. It expires in 20 minutes.
        </p>
        {sent.devOutbox && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Dev mode: no RESEND_API_KEY set. Open the <Link href="/dev/outbox" target="_blank" className="font-medium underline">dev outbox</Link> to find the code.
          </p>
        )}
        <form action={check} noValidate className="mt-5 space-y-4">
          <input type="hidden" name="email" value={sent.sentTo} />
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Code</span>
            <input
              name="code"
              value={code}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
                // Six digits is a complete code: submit without making them find the button.
                if (digits.length === 6) e.target.form?.requestSubmit();
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              className="input text-center font-mono text-2xl tracking-[0.4em]"
              placeholder="000000"
              aria-invalid={!!checked?.error}
            />
          </label>
          {checked?.error && <p className="text-sm text-red-600" role="alert">{checked.error}</p>}
          <SubmitButton pendingText="Checking…" className="btn-primary w-full">Sign in</SubmitButton>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <form action={send}>
            <input type="hidden" name="email" value={sent.sentTo} />
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="underline underline-offset-4" onClick={() => setCode("")}>Send a new code</button>
          </form>
          <button type="button" className="underline underline-offset-4" onClick={() => { setEditing(true); setCode(""); }}>
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    // noValidate: the server checks the address and answers in English; browser bubbles follow the OS language.
    <form action={(fd) => { setEditing(false); send(fd); }} noValidate className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Email</span>
        <input type="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus className="input" placeholder="you@example.com" />
      </label>
      {sent?.error && <p className="text-sm text-red-600" role="alert">{sent.error}</p>}
      <SubmitButton pendingText="Sending code…" className="btn-primary w-full">{submitLabel}</SubmitButton>
    </form>
  );
}
