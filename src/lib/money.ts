import { CURRENCIES, type Currency } from "./config";

export function formatMoney(cents: number, currency: Currency) {
  return new Intl.NumberFormat(CURRENCIES[currency].locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// Local price for a USD-authored price. Keeps the ".99" retail feel.
export function localPrice(usdCents: number, currency: Currency) {
  if (currency === "USD" || usdCents === 0) return usdCents;
  const raw = usdCents * CURRENCIES[currency].rate;
  return Math.max(99, Math.round(raw / 100) * 100 - 1);
}

export function convert(cents: number, from: Currency, to: Currency) {
  if (from === to) return cents;
  return Math.round((cents / CURRENCIES[from].rate) * CURRENCIES[to].rate);
}
