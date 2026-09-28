import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { countryByCode, type Currency } from "./config";
import { db, schema } from "./db";

export type Address = { name: string; line1: string; city: string; postal: string; country: string };

// A believable spot in each country for when the visitor's own city can't be told.
const CAPITALS: Record<string, { city: string; postal: string }> = {
  US: { city: "New York", postal: "10001" },
  GB: { city: "London", postal: "SW1A 1AA" },
  IE: { city: "Dublin", postal: "D02 X285" },
  DE: { city: "Berlin", postal: "10115" },
  FR: { city: "Paris", postal: "75001" },
  IT: { city: "Rome", postal: "00184" },
  ES: { city: "Madrid", postal: "28013" },
  NL: { city: "Amsterdam", postal: "1012 AB" },
};

// Obviously made up, so nobody feels they have to hand over where they live.
export const PRETEND_STREET = "12 Nowhere Lane";

function header(h: Headers, name: string) {
  const value = h.get(name);
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * The address the checkout starts with: the one from the last order, otherwise a pretend street in the
 * visitor's own city, so tracking emails still say "on the van in Milan".
 */
export async function defaultAddress(userId: string, currency: Currency): Promise<Address & { pretend: boolean }> {
  const last = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.userId, userId))
    .orderBy(desc(schema.orders.placedAt))
    .get();
  if (last) {
    return { name: last.shipName, line1: last.shipLine1, city: last.shipCity, postal: last.shipPostal, country: last.shipCountry, pretend: false };
  }

  const h = await headers();
  // Cloudflare sits in front of Vercel, so its headers describe the visitor; Vercel's describe Cloudflare's edge.
  // A city only counts when it comes with the same country, so a nearby edge abroad can't put Rome in France.
  const sources = [
    { country: h.get("cf-ipcountry"), city: header(h, "cf-ipcity"), postal: header(h, "cf-postal-code") },
    { country: h.get("x-vercel-ip-country"), city: header(h, "x-vercel-ip-city"), postal: header(h, "x-vercel-ip-postal-code") },
  ];
  const visitorCountry = sources.find((s) => s.country)?.country?.toUpperCase();
  const country = visitorCountry && countryByCode(visitorCountry)
    ? visitorCountry
    : currency === "GBP" ? "GB" : currency === "EUR" ? "IE" : "US";
  // City and postcode travel together, so Milan never ends up with a Rome postcode.
  const local = sources.find((s) => s.country?.toUpperCase() === country && s.city && s.postal);
  const place = local ? { city: local.city!, postal: local.postal! } : CAPITALS[country];
  return {
    name: "",
    line1: PRETEND_STREET,
    city: place.city,
    postal: place.postal,
    country,
    pretend: true,
  };
}
