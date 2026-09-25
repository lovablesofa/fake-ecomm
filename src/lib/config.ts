export const BRAND = {
  name: "Window Spree",
  tagline: "All the spree. None of the bill.",
  carrier: "Nowhere Express",
  description: "The full online shopping experience, from bag to doorstep, with nothing charged and nothing shipped.",
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

// timeZone keeps "Out for delivery" and "Delivered" in daylight hours. The US spans several zones;
// Central keeps the 9:00-20:00 delivery window between 7:00 Pacific and 21:00 Eastern.
export const COUNTRIES = [
  { code: "US", name: "United States", region: "US", timeZone: "America/Chicago" },
  { code: "GB", name: "United Kingdom", region: "GB", timeZone: "Europe/London" },
  { code: "IE", name: "Ireland", region: "EU", timeZone: "Europe/Dublin" },
  { code: "DE", name: "Germany", region: "EU", timeZone: "Europe/Berlin" },
  { code: "FR", name: "France", region: "EU", timeZone: "Europe/Paris" },
  { code: "IT", name: "Italy", region: "EU", timeZone: "Europe/Rome" },
  { code: "ES", name: "Spain", region: "EU", timeZone: "Europe/Madrid" },
  { code: "NL", name: "Netherlands", region: "EU", timeZone: "Europe/Amsterdam" },
] as const satisfies readonly { code: string; name: string; region: Region; timeZone: string }[];

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function countryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

// USD cents; converted like any other price.
export const SHIPPING = {
  standard: { label: "Standard", eta: "3–4 days", priceUsd: 0 },
  express: { label: "Express", eta: "1 day", priceUsd: 1299 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING;

// Pretend money each account can "spend" per calendar month, in USD cents.
export const MONTHLY_BUDGET_USD = 50_000;

export const CART_LIMITS = { maxLines: 30, maxQty: 10 };
