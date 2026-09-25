"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCart } from "@/app/actions";
import { SubmitButton } from "./submit-button";

export function AddToCart({ slug }: { slug: string }) {
  const [state, action] = useActionState(addToCart, null);
  const [qty, setQty] = useState(1);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm text-muted">Quantity</label>
        <select id="qty" name="quantity" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="rounded-lg border border-line bg-white px-3 py-2">
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <SubmitButton pendingText="Adding…" className="btn-primary">Add to bag</SubmitButton>
        <SubmitButton name="intent" value="buy-now" className="btn-secondary">Buy now</SubmitButton>
      </div>
      <p className="min-h-5 text-sm" aria-live="polite">
        {state?.ok && (
          <span key={state.at} className="text-accent">
            Added to your bag. <Link href="/cart" className="font-medium underline">View bag →</Link>
          </span>
        )}
      </p>
    </form>
  );
}
