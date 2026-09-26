"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCart } from "@/app/actions";
import type { Product } from "@/lib/catalog";
import { SubmitButton } from "./submit-button";

export function AddToCart({ slug, options }: { slug: string; options?: Product["options"] }) {
  const [state, action] = useActionState(addToCart, null);
  const [qty, setQty] = useState(1);
  const [option, setOption] = useState("");
  // Our own check instead of `required`: the browser's bubble speaks the OS language, not the site's English.
  const [missing, setMissing] = useState(false);
  const label = options ? (/^.[a-z]/.test(options.label) ? options.label.toLowerCase() : options.label) : "";
  return (
    // React resets the form after the action runs; remounting re-applies the chosen size and quantity.
    <form
      key={state?.at}
      action={action}
      onSubmit={(e) => {
        if (options && !option) {
          e.preventDefault();
          setMissing(true);
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="slug" value={slug} />
      {options && (
        <fieldset>
          <legend className={`text-sm ${missing ? "text-red-600" : "text-muted"}`}>
            {options.label}{option && <>: <span className="text-ink">{option}</span></>}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.values.map((v) => (
              <label key={v} className="cursor-pointer">
                <input type="radio" name="option" value={v} checked={option === v} onChange={() => { setOption(v); setMissing(false); }} className="peer sr-only" />
                <span className={`inline-flex min-w-11 items-center justify-center rounded-lg border bg-white ${missing ? "border-red-400" : "border-line"} px-3 py-2 text-sm tabular-nums peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:ring-1 peer-checked:ring-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent`}>{v}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
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
        {missing ? (
          <span className="text-red-600">Choose your {label} first.</span>
        ) : (
          state && !state.ok && state.error && <span className="text-red-600">{state.error}</span>
        )}
        {state?.ok && (
          <span key={state.at} className="text-accent">
            Added to your bag. <Link href="/cart" className="font-medium underline">View bag →</Link>
          </span>
        )}
      </p>
    </form>
  );
}
