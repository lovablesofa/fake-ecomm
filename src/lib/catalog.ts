import { GENERATED_PRODUCTS } from "./catalog.generated";

export const CATEGORIES = [
  { slug: "tech", name: "Tech" },
  { slug: "fashion", name: "Fashion" },
  { slug: "home", name: "Home" },
  { slug: "beauty", name: "Beauty" },
  { slug: "outdoors", name: "Outdoors" },
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
};

// All brands and products are fictional.
const HANDWRITTEN_PRODUCTS: Product[] = [
  {
    slug: "halcyon-anc-headphones",
    name: "Halcyon ANC Headphones",
    brand: "Vellora Audio",
    category: "tech",
    priceUsd: 34999,
    compareAtUsd: 39999,
    rating: 4.8,
    reviews: 2184,
    blurb: "Studio-grade sound with adaptive noise cancelling that learns your commute.",
    details: ["40-hour battery", "Adaptive ANC with 3 transparency modes", "Memory-foam cushions", "USB-C fast charge: 10 min = 5 hours"],
    art: { kind: "headphones", hue: 220 },
    badge: "Bestseller",
  },
  {
    slug: "meridian-smartwatch",
    name: "Meridian Smartwatch S3",
    brand: "Ostrand",
    category: "tech",
    priceUsd: 42900,
    rating: 4.6,
    reviews: 973,
    blurb: "Sapphire glass, titanium case, and a battery that lasts a full week.",
    details: ["7-day battery", "ECG and sleep tracking", "Titanium case, 42mm", "Water resistant to 50m"],
    art: { kind: "watch", hue: 200 },
  },
  {
    slug: "pulse-mini-speaker",
    name: "Pulse Mini Speaker",
    brand: "Vellora Audio",
    category: "tech",
    priceUsd: 12999,
    rating: 4.5,
    reviews: 1540,
    blurb: "Room-filling 360° sound in a speaker the size of a coffee cup.",
    details: ["360° sound", "IP67 waterproof", "18-hour battery", "Pair two for stereo"],
    art: { kind: "speaker", hue: 12 },
  },
  {
    slug: "lumen-x-mirrorless-camera",
    name: "Lumen X Mirrorless Camera",
    brand: "Quimby & Vale",
    category: "tech",
    priceUsd: 189900,
    compareAtUsd: 209900,
    rating: 4.9,
    reviews: 412,
    blurb: "Full-frame, 33MP, and colour science that makes everything look like a film still.",
    details: ["33MP full-frame sensor", "4K 60fps video", "In-body stabilisation", "Weather-sealed body"],
    art: { kind: "camera", hue: 30 },
    badge: "Limited",
  },
  {
    slug: "tactile-75-keyboard",
    name: "Tactile 75 Mechanical Keyboard",
    brand: "Keyforge Row",
    category: "tech",
    priceUsd: 18900,
    rating: 4.7,
    reviews: 866,
    blurb: "Gasket-mounted, hot-swappable, and deeply satisfying to type on.",
    details: ["75% layout", "Hot-swap switches", "Aluminium case", "Tri-mode wireless"],
    art: { kind: "keyboard", hue: 260 },
  },
  {
    slug: "cloudstride-runner",
    name: "Cloudstride Runner",
    brand: "Fernwick",
    category: "fashion",
    priceUsd: 16000,
    rating: 4.6,
    reviews: 3302,
    blurb: "A daily trainer with foam so soft it feels like cheating.",
    details: ["Supercritical foam midsole", "Recycled knit upper", "8mm drop", "Weighs 238g"],
    art: { kind: "sneaker", hue: 150 },
    badge: "Trending",
  },
  {
    slug: "atlas-waxed-jacket",
    name: "Atlas Waxed Field Jacket",
    brand: "Marlowe & Pike",
    category: "fashion",
    priceUsd: 39500,
    rating: 4.8,
    reviews: 511,
    blurb: "Waxed cotton that gets better with every rainy season.",
    details: ["Waxed organic cotton", "Corduroy collar", "Tartan lining", "Four bellows pockets"],
    art: { kind: "jacket", hue: 90 },
  },
  {
    slug: "everyday-leather-tote",
    name: "Everyday Leather Tote",
    brand: "Solenne",
    category: "fashion",
    priceUsd: 28500,
    compareAtUsd: 32000,
    rating: 4.7,
    reviews: 1209,
    blurb: "Fits a laptop, a water bottle, and every excuse to buy another bag.",
    details: ["Full-grain Italian leather", "Fits 14\" laptop", "Magnetic closure", "Interior zip pocket"],
    art: { kind: "tote", hue: 25 },
  },
  {
    slug: "riviera-sunglasses",
    name: "Riviera Polarised Sunglasses",
    brand: "Lunetto",
    category: "fashion",
    priceUsd: 18500,
    rating: 4.5,
    reviews: 748,
    blurb: "Handmade acetate frames with lenses tuned for Mediterranean glare.",
    details: ["Polarised CR-39 lenses", "Handmade acetate", "100% UV protection", "Includes leather case"],
    art: { kind: "sunglasses", hue: 340 },
  },
  {
    slug: "commuter-rolltop-backpack",
    name: "Commuter Rolltop Backpack",
    brand: "Marlowe & Pike",
    category: "fashion",
    priceUsd: 17900,
    rating: 4.6,
    reviews: 1877,
    blurb: "Weatherproof, expandable, and suspiciously good at organising cables.",
    details: ["20–26L expandable", "Waterproof TPU fabric", "Padded 16\" laptop sleeve", "Luggage pass-through"],
    art: { kind: "backpack", hue: 190 },
  },
  {
    slug: "arc-floor-lamp",
    name: "Arc Brass Floor Lamp",
    brand: "Harrowgate Home",
    category: "home",
    priceUsd: 54900,
    rating: 4.7,
    reviews: 302,
    blurb: "A sculptural brass arc that turns any corner into a reading nook.",
    details: ["Brushed brass finish", "Dimmable warm LED", "Marble base", "Height 190cm"],
    art: { kind: "lamp", hue: 45 },
  },
  {
    slug: "sable-lounge-chair",
    name: "Sable Lounge Chair",
    brand: "Harrowgate Home",
    category: "home",
    priceUsd: 124900,
    compareAtUsd: 139900,
    rating: 4.9,
    reviews: 188,
    blurb: "Mid-century lines, bouclé upholstery, and a recline that ends conversations.",
    details: ["Solid walnut frame", "Bouclé upholstery", "Hand-tied springs", "Ships assembled (in theory)"],
    art: { kind: "chair", hue: 35 },
    badge: "Editor's pick",
  },
  {
    slug: "stoneware-mug-set",
    name: "Stoneware Mug Set of 4",
    brand: "Kilnhouse",
    category: "home",
    priceUsd: 6400,
    rating: 4.8,
    reviews: 2640,
    blurb: "Hand-glazed mugs, each one slightly different, all of them perfect.",
    details: ["Set of four, 350ml", "Hand-glazed stoneware", "Dishwasher safe", "Made in Portugal"],
    art: { kind: "mug", hue: 170 },
  },
  {
    slug: "fiddle-leaf-fig",
    name: "Fiddle Leaf Fig, 120cm",
    brand: "Greenhaus",
    category: "home",
    priceUsd: 11900,
    rating: 4.3,
    reviews: 954,
    blurb: "The plant everyone wants and nobody keeps alive. Here, it can't die.",
    details: ["120cm tall", "Ceramic pot included", "Bright indirect light", "Guaranteed never to drop a leaf*"],
    art: { kind: "plant", hue: 120 },
  },
  {
    slug: "fireside-soy-candle",
    name: "Fireside Soy Candle",
    brand: "Kilnhouse",
    category: "home",
    priceUsd: 4200,
    rating: 4.7,
    reviews: 4011,
    blurb: "Cedar, smoked vanilla, and the feeling of a cabin you don't own.",
    details: ["60-hour burn", "Coconut-soy wax", "Cotton wick", "Reusable ceramic vessel"],
    art: { kind: "candle", hue: 15 },
  },
  {
    slug: "dew-barrier-serum",
    name: "Dew Barrier Serum",
    brand: "Aurelle",
    category: "beauty",
    priceUsd: 6800,
    rating: 4.6,
    reviews: 5120,
    blurb: "Ceramides and peptides for skin that looks like it drinks eight glasses a day.",
    details: ["30ml", "Ceramides + peptides", "Fragrance free", "Dermatologist tested"],
    art: { kind: "bottle", hue: 300 },
    badge: "Viral",
  },
  {
    slug: "nightfall-eau-de-parfum",
    name: "Nightfall Eau de Parfum",
    brand: "Maison Veyra",
    category: "beauty",
    priceUsd: 16500,
    rating: 4.8,
    reviews: 866,
    blurb: "Fig, black tea and amber. Smells like an expensive decision.",
    details: ["50ml", "Fig, black tea, amber", "Long-lasting (8h+)", "Refillable bottle"],
    art: { kind: "bottle", hue: 280 },
  },
  {
    slug: "glow-ritual-set",
    name: "Glow Ritual Set",
    brand: "Aurelle",
    category: "beauty",
    priceUsd: 12400,
    compareAtUsd: 15000,
    rating: 4.5,
    reviews: 1433,
    blurb: "Cleanser, toner, serum, cream. The four-step routine you'll follow for a week.",
    details: ["Four full-size products", "Vitamin C + niacinamide", "Vegan formula", "Gift-ready box"],
    art: { kind: "bottle", hue: 20 },
  },
  {
    slug: "summit-hiking-pack",
    name: "Summit 40L Hiking Pack",
    brand: "Ridgeline Supply",
    category: "outdoors",
    priceUsd: 23900,
    rating: 4.7,
    reviews: 690,
    blurb: "Ventilated back panel, hip-belt pockets, and room for one more snack.",
    details: ["40L capacity", "Ventilated mesh back", "Rain cover included", "1.2kg"],
    art: { kind: "backpack", hue: 100 },
  },
  {
    slug: "trailhead-insulated-bottle",
    name: "Trailhead Insulated Bottle",
    brand: "Ridgeline Supply",
    category: "outdoors",
    priceUsd: 4500,
    rating: 4.8,
    reviews: 6210,
    blurb: "Cold for 24 hours, hot for 12, lost for approximately three weeks.",
    details: ["750ml", "Double-wall vacuum", "Leak-proof lid", "Powder-coated finish"],
    art: { kind: "bottle", hue: 180 },
  },
  {
    slug: "alpine-trail-shoe",
    name: "Alpine Trail Shoe",
    brand: "Fernwick",
    category: "outdoors",
    priceUsd: 18500,
    rating: 4.6,
    reviews: 1102,
    blurb: "Aggressive lugs and a waterproof membrane for mud you'll never actually walk through.",
    details: ["Waterproof membrane", "5mm lugs", "Rock plate", "Vibram-style outsole"],
    art: { kind: "sneaker", hue: 25 },
  },
  {
    slug: "basecamp-shell-jacket",
    name: "Basecamp 3L Shell Jacket",
    brand: "Ridgeline Supply",
    category: "outdoors",
    priceUsd: 34900,
    rating: 4.7,
    reviews: 544,
    blurb: "Three-layer waterproof shell that packs into its own pocket.",
    details: ["3-layer waterproof", "Pit zips", "Helmet-compatible hood", "Packs into chest pocket"],
    art: { kind: "jacket", hue: 5 },
  },
];

// Hand-written products first, then the ones built from catalog/products.csv (see scripts/catalog).
export const PRODUCTS: Product[] = [
  ...HANDWRITTEN_PRODUCTS,
  ...GENERATED_PRODUCTS.filter((g) => !HANDWRITTEN_PRODUCTS.some((p) => p.slug === g.slug)),
];

const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProduct(slug: string) {
  return BY_SLUG.get(slug);
}

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
