import { cookies } from "next/headers";
import { CART_LIMITS, isCurrency, type Currency } from "./config";
import { getProduct, type Product } from "./catalog";
import { localPrice } from "./money";

const CART_COOKIE = "cart";
const CURRENCY_COOKIE = "currency";

type CartEntry = { s: string; q: number };

export type CartLine = { product: Product; quantity: number; unitPrice: number; lineTotal: number };

function parse(raw: string | undefined): CartEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((e): e is CartEntry => typeof e?.s === "string" && Number.isInteger(e?.q))
      .filter((e) => getProduct(e.s) && e.q > 0)
      .map((e) => ({ s: e.s, q: Math.min(e.q, CART_LIMITS.maxQty) }))
      .slice(0, CART_LIMITS.maxLines);
  } catch {
    return [];
  }
}

export async function readCartEntries() {
  return parse((await cookies()).get(CART_COOKIE)?.value);
}

export async function writeCartEntries(entries: CartEntry[]) {
  (await cookies()).set(CART_COOKIE, JSON.stringify(entries.slice(0, CART_LIMITS.maxLines)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCart() {
  (await cookies()).delete(CART_COOKIE);
}

export async function getCurrency(): Promise<Currency> {
  const value = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(value) ? value : "USD";
}

export async function setCurrencyCookie(currency: Currency) {
  (await cookies()).set(CURRENCY_COOKIE, currency, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function getCart() {
  const [entries, currency] = await Promise.all([readCartEntries(), getCurrency()]);
  const lines: CartLine[] = entries.map((e) => {
    const product = getProduct(e.s)!;
    const unitPrice = localPrice(product.priceUsd, currency);
    return { product, quantity: e.q, unitPrice, lineTotal: unitPrice * e.q };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { lines, subtotal, count, currency };
}
