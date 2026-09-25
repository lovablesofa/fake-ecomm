"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={className} aria-busy={pending}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
