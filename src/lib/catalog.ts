import type { Currency } from "./config";
import { convert, formatWhole } from "./money";
import { GENERATED_PRODUCTS } from "./catalog.generated";

export const CATEGORIES = [
  { slug: "fashion", name: "Fashion" },
  { slug: "beauty", name: "Beauty" },
  { slug: "accessories", name: "Accessories" },
  { slug: "home", name: "Home" },
  { slug: "tech", name: "Tech" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export type ArtKind =
  | "headphones" | "watch" | "sneaker" | "tote" | "lamp" | "chair" | "bottle" | "speaker"
  | "mug" | "plant" | "sunglasses" | "candle" | "backpack" | "camera" | "keyboard" | "jacket";

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  priceUsd: number; // cents
  compareAtUsd?: number;
  rating: number;
  reviews: number;
  blurb: string;
  details: string[];
  art: { kind: ArtKind; hue: number };
  // Real photo under /public, e.g. "/products/halcyon-anc-headphones.jpg". Falls back to `art` when absent.
  image?: string;
  badge?: string;
  // A choice the shopper makes before adding to the bag, e.g. { label: "Size", values: ["S", "M", "L"] }.
  options?: { label: string; values: string[] };
};

// All brands and products are fictional. The catalog is built from catalog/products.csv (see scripts/catalog).
export const PRODUCTS: Product[] = GENERATED_PRODUCTS;

const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProduct(slug: string) {
  return BY_SLUG.get(slug);
}

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

// Shop shortcuts next to the categories: cheap impulse buys and markdowns.
export const UNDER_USD = 2500; // cents
export const DEALS = ["under-25", "sale"] as const;
export type DealSlug = (typeof DEALS)[number];

export function matchesDeal(p: Product, deal: DealSlug) {
  return deal === "sale" ? !!p.compareAtUsd && p.compareAtUsd > p.priceUsd : p.priceUsd <= UNDER_USD;
}

/** "Under $25" / "Under £20" follows the shopper's currency. */
export function dealName(deal: DealSlug, currency: Currency) {
  return deal === "sale" ? "Deals" : `Under ${formatWhole(Math.round(convert(UNDER_USD, "USD", currency) / 100) * 100, currency)}`;
}
