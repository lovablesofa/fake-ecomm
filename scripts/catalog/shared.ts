import fs from "node:fs";
import { parseEnv } from "node:util";
import { z } from "zod";
import { CATEGORIES, type ArtKind } from "../../src/lib/catalog";

export const CSV_PATH = "catalog/products.csv";
export const IMAGE_DIR = "public/products";
export const GENERATED_TS = "src/lib/catalog.generated.ts";

export const ART_KINDS = [
  "headphones", "watch", "sneaker", "tote", "lamp", "chair", "bottle", "speaker",
  "mug", "plant", "sunglasses", "candle", "backpack", "camera", "keyboard", "jacket",
] as const satisfies readonly ArtKind[];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

// Column order of products.csv. Prices are in dollars so the sheet is easy to edit by hand.
export const COLUMNS = [
  "slug", "name", "brand", "category", "price_usd", "compare_at_usd", "rating", "reviews",
  "blurb", "details", "badge", "art_kind", "hue", "image_prompt", "options",
] as const;
export type Row = Record<(typeof COLUMNS)[number], string>;

// `details` holds several bullet points in one cell.
export const DETAILS_SEP = " | ";

// `options` is empty or "Label: value | value | value", e.g. "Size: S | M | L".
function parseOptions(v: string, ctx: z.RefinementCtx) {
  if (!v.trim()) return undefined;
  const match = v.match(/^([^:]+):(.+)$/);
  const values = match?.[2].split(DETAILS_SEP.trim()).map((o) => o.trim()).filter(Boolean) ?? [];
  if (!match || values.length < 2 || new Set(values).size !== values.length) {
    ctx.addIssue({ code: "custom", message: 'must be empty or "Label: a | b | ..." with at least 2 distinct values' });
    return undefined;
  }
  return { label: match[1].trim(), values };
}

/** Validates one CSV row and converts it to the catalog's Product shape. */
export const RowSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase-with-dashes only"),
    name: z.string().min(1),
    brand: z.string().min(1),
    category: z.enum(CATEGORY_SLUGS),
    price_usd: z.coerce.number().positive(),
    compare_at_usd: z.string().transform((v, ctx) => {
      if (!v.trim()) return undefined;
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) ctx.addIssue({ code: "custom", message: "must be a positive number or empty" });
      return n;
    }),
    rating: z.coerce.number().min(1).max(5),
    reviews: z.coerce.number().int().min(0),
    blurb: z.string().min(1),
    details: z.string().transform((v) => v.split(DETAILS_SEP.trim()).map((d) => d.trim()).filter(Boolean)),
    badge: z.string().transform((v) => v.trim() || undefined),
    art_kind: z.enum(ART_KINDS),
    hue: z.coerce.number().int().min(0).max(359),
    image_prompt: z.string().min(1),
    options: z.string().transform(parseOptions),
  })
  .refine((r) => r.compare_at_usd === undefined || r.compare_at_usd > r.price_usd, {
    message: "compare_at_usd must be higher than price_usd",
    path: ["compare_at_usd"],
  });

// Minimal RFC 4180 CSV: quoted fields, escaped quotes, newlines inside quotes.
export function parseCsv(text: string): Row[] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { record.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      record.push(field); field = "";
      if (record.some((f) => f !== "")) records.push(record);
      record = [];
    } else field += ch;
  }
  record.push(field);
  if (record.some((f) => f !== "")) records.push(record);

  const [header, ...body] = records;
  if (!header) return [];
  const missing = COLUMNS.filter((c) => c !== "options" && !header.includes(c));
  if (missing.length) throw new Error(`${CSV_PATH} is missing columns: ${missing.join(", ")}`);
  return body.map((cells) => Object.fromEntries(COLUMNS.map((c) => [c, cells[header.indexOf(c)] ?? ""])) as Row);
}

export function toCsv(rows: Row[]) {
  const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c] ?? "")).join(","))].join("\n") + "\n";
}

export function readRows(): Row[] {
  return fs.existsSync(CSV_PATH) ? parseCsv(fs.readFileSync(CSV_PATH, "utf8")) : [];
}

/** Loads .env then .env.local (later wins, like Next.js). Shell vars win over both; empty values never override. */
export function loadEnv() {
  const fromFiles: Record<string, string> = {};
  for (const file of [".env", ".env.local"]) {
    if (!fs.existsSync(file)) continue;
    for (const [key, value] of Object.entries(parseEnv(fs.readFileSync(file, "utf8")))) {
      if (value) fromFiles[key] = value;
    }
  }
  for (const [key, value] of Object.entries(fromFiles)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

/** Runs `fn` over `items` with at most `limit` in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}
