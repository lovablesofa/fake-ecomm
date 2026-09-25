export const BRAND = {
  name: "Cartharsis",
  tagline: "Shop everything. Spend nothing.",
  carrier: "Nowhere Express",
};

export const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type Currency = "USD" | "GBP" | "EUR";

// Fixed display rates relative to USD. Prices are authored in USD cents.
export const CURRENCIES: Record<Currency, { rate: number; locale: string; label: string }> = {
  USD: { rate: 1, locale: "en-US", label: "USD $" },
  GBP: { rate: 0.79, locale: "en-GB", label: "GBP £" },
  EUR: { rate: 0.92, locale: "en-IE", label: "EUR €" },
};

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && value in CURRENCIES;
}

export type Region = "US" | "GB" | "EU";

export const COUNTRIES = [
  { code: "US", name: "United States", region: "US" },
  { code: "GB", name: "United Kingdom", region: "GB" },
  { code: "IE", name: "Ireland", region: "EU" },
  { code: "DE", name: "Germany", region: "EU" },
  { code: "FR", name: "France", region: "EU" },
  { code: "IT", name: "Italy", region: "EU" },
  { code: "ES", name: "Spain", region: "EU" },
  { code: "NL", name: "Netherlands", region: "EU" },
] as const satisfies readonly { code: string; name: string; region: Region }[];

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function countryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

// USD cents; converted like any other price.
export const SHIPPING = {
  standard: { label: "Standard", eta: "2–3 days", priceUsd: 0 },
  express: { label: "Express", eta: "Next day", priceUsd: 1299 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING;

export const CART_LIMITS = { maxLines: 30, maxQty: 10 };
