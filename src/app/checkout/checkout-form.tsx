"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { placeOrder, type CheckoutState } from "@/app/actions";
import { ProductArt } from "@/components/product-art";
import type { ArtKind } from "@/lib/catalog";
import type { Currency } from "@/lib/config";
import { formatMoney } from "@/lib/money";

type Props = {
  email: string;
  currency: Currency;
  subtotal: number;
  lines: { slug: string; name: string; quantity: number; lineTotal: number; art: { kind: ArtKind; hue: number }; image?: string }[];
  shippingOptions: { id: "standard" | "express"; label: string; eta: string; price: number }[];
  countries: { code: string; name: string }[];
  defaultCountry: string;
};

function Field({ label, name, errors, ...rest }: { label: string; name: string; errors?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <input name={name} className={`input ${errors ? "border-red-400" : ""}`} aria-invalid={!!errors} {...rest} />
      {errors && <span className="mt-1 block text-red-600">{errors[0]}</span>}
    </label>
  );
}

function PayButton({ total }: { total: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button type="submit" disabled={pending} className="btn-primary w-full py-4 text-base">
        {pending ? "Processing payment…" : `Pay ${total}`}
      </button>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/80 backdrop-blur-sm" role="status">
          <div className="card flex flex-col items-center gap-4 px-10 py-8 shadow-xl">
            <span className="size-10 animate-spin rounded-full border-4 border-line border-t-ink" />
            <p className="font-medium">Authorising payment…</p>
            <p className="text-sm text-muted">Pretending to talk to your bank</p>
          </div>
        </div>
      )}
    </>
  );
}

export function CheckoutForm(props: Props) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrder, undefined);
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const shipping = props.shippingOptions.find((o) => o.id === method)!.price;
  const total = props.subtotal + shipping;
  const fe = state?.fieldErrors;
  const v = state?.values;
  const money = (c: number) => formatMoney(c, props.currency);

  return (
    <form key={JSON.stringify(v ?? null)} action={action} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <section>
          <h2 className="text-lg font-medium">Contact</h2>
          <p className="mt-2 text-sm text-muted">Order confirmation and tracking updates go to <strong className="text-ink">{props.email}</strong></p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium">Shipping address</h2>
          <Field label="Full name" name="name" defaultValue={v?.name} autoComplete="name" required errors={fe?.name} />
          <Field label="Address" name="line1" defaultValue={v?.line1} autoComplete="address-line1" required errors={fe?.line1} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" name="city" defaultValue={v?.city} autoComplete="address-level2" required errors={fe?.city} />
            <Field label="Postcode / ZIP" name="postal" defaultValue={v?.postal} autoComplete="postal-code" required errors={fe?.postal} />
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Country</span>
              <select name="country" defaultValue={v?.country ?? props.defaultCountry} className="input" autoComplete="country">
                {props.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <p className="text-xs text-muted">Nothing is delivered, so a rough address is fine. We use it to make tracking feel real.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Delivery</h2>
          {props.shippingOptions.map((o) => (
            <label key={o.id} className={`flex cursor-pointer items-center justify-between rounded-xl border bg-white p-4 ${method === o.id ? "border-ink ring-1 ring-ink" : "border-line"}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="shipping" value={o.id} checked={method === o.id} onChange={() => setMethod(o.id)} className="accent-ink" />
                <span><span className="font-medium">{o.label}</span><span className="block text-sm text-muted">{o.eta}</span></span>
              </span>
              <span className="text-sm font-medium">{o.price ? money(o.price) : "Free"}</span>
            </label>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Payment</h2>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 to-stone-950 p-6 text-white shadow-lg sm:max-w-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-display text-xl">Pretend Pay</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">Simulated</span>
            </div>
            <p className="mt-10 font-mono text-lg tracking-widest">•••• •••• •••• 0000</p>
            <div className="mt-4 flex justify-between text-xs text-white/70">
              <span>Unlimited imaginary balance</span><span>∞/∞</span>
            </div>
          </div>
          <p className="text-sm text-muted">No card details needed. Nothing is charged and no bank is contacted.</p>
        </section>
      </div>

      <aside className="card h-fit p-6 lg:sticky lg:top-32">
        <h2 className="font-medium">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {props.lines.map((l) => (
            <li key={l.slug} className="flex items-center gap-3 text-sm">
              <div className="relative">
                <ProductArt {...l.art} image={l.image} alt={l.name} sizes="56px" className="size-14 rounded-lg" />
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-ink px-1.5 text-xs text-white">{l.quantity}</span>
              </div>
              <span className="flex-1">{l.name}</span>
              <span>{money(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(props.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{shipping ? money(shipping) : "Free"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>Included</dd></div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-semibold">
          <span>Total</span><span>{money(total)}</span>
        </div>
        <div className="mt-6"><PayButton total={money(total)} /></div>
        {state?.error && <p className="mt-3 text-sm text-red-600" role="alert">{state.error}</p>}
        <p className="mt-3 text-center text-xs text-muted">This is a simulated purchase. You will not be charged.</p>
      </aside>
    </form>
  );
}
