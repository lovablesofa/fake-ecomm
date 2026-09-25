import { GENERATED_PRODUCTS } from "./catalog.generated";

export const CATEGORIES = [
  { slug: "fashion", name: "Fashion" },
  { slug: "beauty", name: "Beauty" },
  { slug: "accessories", name: "Accessories" },
  { slug: "home", name: "Home" },
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
