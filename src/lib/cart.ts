import { cookies, headers } from "next/headers";
import { CART_LIMITS, currencyForCountry, isCurrency, type Currency } from "./config";
import { getProduct, type Product } from "./catalog";
import { localPrice } from "./money";

const CART_COOKIE = "cart";
const CURRENCY_COOKIE = "currency";

// `o` is the chosen option value (e.g. a size) for products that have options.
export type CartEntry = { s: string; q: number; o?: string };

export type CartLine = { product: Product; option?: string; quantity: number; unitPrice: number; lineTotal: number };

/** The option value if it's valid for this product, "" for products without options, otherwise null. */
export function validOption(product: Product, option: unknown) {
  if (!product.options) return "";
  return typeof option === "string" && product.options.values.includes(option) ? option : null;
}

export function sameLine(e: CartEntry, slug: string, option?: string) {
  return e.s === slug && (e.o ?? "") === (option ?? "");
}

function parse(raw: string | undefined): CartEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((e): e is CartEntry => typeof e?.s === "string" && Number.isInteger(e?.q) && e.q > 0)
      .flatMap((e) => {
        const product = getProduct(e.s);
        const option = product && validOption(product, e.o);
        if (option === null || option === undefined) return [];
        return [{ s: e.s, q: Math.min(e.q, CART_LIMITS.maxQty), ...(option && { o: option }) }];
      })
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
  if (isCurrency(value)) return value;
  // No choice made yet: guess from the visitor's country. Cloudflare's header wins while its proxy sits in front of Vercel.
  const h = await headers();
  return currencyForCountry(h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country"));
}

export async function setCurrencyCookie(currency: Currency) {
  (await cookies()).set(CURRENCY_COOKIE, currency, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function getCart() {
  const [entries, currency] = await Promise.all([readCartEntries(), getCurrency()]);
  const lines: CartLine[] = entries.map((e) => {
    const product = getProduct(e.s)!;
    const unitPrice = localPrice(product.priceUsd, currency);
    return { product, option: e.o, quantity: e.q, unitPrice, lineTotal: unitPrice * e.q };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { lines, subtotal, count, currency };
}
