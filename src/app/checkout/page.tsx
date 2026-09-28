import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductArt } from "@/components/product-art";
import { getCurrentUser } from "@/lib/auth";
import { userBudget } from "@/lib/budget";
import { getCart } from "@/lib/cart";
import { COUNTRIES, SHIPPING } from "@/lib/config";
import { formatMoney, localPrice } from "@/lib/money";
import { LoginForm } from "../login/login-form";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  if (!cart.lines.length) redirect("/cart");

  // Signing in happens here, next to the bag, instead of a detour to /login: most shoppers used to drop off there.
  if (!user) {
    const money = (c: number) => formatMoney(c, cart.currency);
    return (
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <h1 className="font-display text-5xl">Checkout</h1>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <section className="card h-fit p-6 sm:p-8">
            <h2 className="font-display text-2xl">First, your email</h2>
            <p className="mt-2 text-muted">
              We&apos;ll send a 6-digit code to sign you in. Your order confirmation and tracking updates go to the same address.
            </p>
            <div className="max-w-md">
              <LoginForm next="/checkout" submitLabel="Continue" />
            </div>
          </section>
          <aside className="card h-fit p-6">
            <h2 className="font-medium">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {cart.lines.map((l) => (
                <li key={`${l.product.slug}:${l.option ?? ""}`} className="flex items-center gap-3 text-sm">
                  <div className="relative">
                    <ProductArt {...l.product.art} image={l.product.image} alt={l.product.name} sizes="56px" className="size-14 rounded-lg" />
                    <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent px-1.5 text-xs text-white">{l.quantity}</span>
                  </div>
                  <span className="flex-1">{l.product.name}</span>
                  <span>{money(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-line pt-4 font-semibold">
              <span>Subtotal</span><span>{money(cart.subtotal)}</span>
            </div>
            <p className="mt-3 text-center text-xs text-muted">This is a simulated purchase. You will not be charged.</p>
          </aside>
        </div>
      </div>
    );
  }
  const budget = await userBudget(user.id, cart.currency);

  const shippingOptions = Object.entries(SHIPPING).map(([id, s]) => ({
    id: id as keyof typeof SHIPPING,
    label: s.label,
    eta: s.eta,
    price: localPrice(s.priceUsd, cart.currency),
  }));
  const defaultCountry = cart.currency === "GBP" ? "GB" : cart.currency === "EUR" ? "IE" : "US";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-5xl">Checkout</h1>
      <CheckoutForm
        email={user.email}
        currency={cart.currency}
        budget={{ limit: budget.limit, remaining: budget.remaining, resetsOn: budget.resetsOn.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) }}
        subtotal={cart.subtotal}
        lines={cart.lines.map((l) => ({ key: `${l.product.slug}:${l.option ?? ""}`, name: l.product.name, option: l.option && `${l.product.options?.label}: ${l.option}`, quantity: l.quantity, lineTotal: l.lineTotal, art: l.product.art, image: l.product.image }))}
        shippingOptions={shippingOptions}
        countries={COUNTRIES.map((c) => ({ code: c.code, name: c.name }))}
        defaultCountry={defaultCountry}
      />
    </div>
  );
}
