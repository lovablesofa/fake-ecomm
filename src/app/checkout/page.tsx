import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { userBudget } from "@/lib/budget";
import { getCart } from "@/lib/cart";
import { COUNTRIES, SHIPPING } from "@/lib/config";
import { localPrice } from "@/lib/money";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCart();
  if (!cart.lines.length) redirect("/cart");
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
