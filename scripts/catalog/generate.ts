// Step 1: writes catalog/products.csv with LLM-generated products.
// Usage: pnpm catalog:generate [--count 500]
// Resumable: rows already in the CSV count toward the target, so re-running only fills the gap.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CATEGORIES, PRODUCTS } from "../../src/lib/catalog";
import { ART_KINDS, CSV_PATH, DETAILS_SEP, loadEnv, mapLimit, readRows, toCsv, type Row } from "./shared";

const MODEL = "deepseek/deepseek-v4-flash-0731";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const BATCH = 20;
const MAX_ATTEMPTS = 3;

const PRICE_HINTS: Record<string, string> = {
  tech: "$19 to $2,500",
  fashion: "$15 to $900",
  home: "$12 to $1,800",
  beauty: "$8 to $250",
  outdoors: "$15 to $1,200",
};

const Batch = z.object({
  products: z.array(
    z.object({
      name: z.string(),
      brand: z.string(),
      price_usd: z.number(),
      compare_at_usd: z.number().nullable(),
      rating: z.number(),
      reviews: z.number(),
      blurb: z.string(),
      details: z.array(z.string()),
      badge: z.string().nullable(),
      art_kind: z.enum(ART_KINDS),
      hue: z.number(),
      image_prompt: z.string(),
    }),
  ),
});

const SYSTEM = `You write product listings for Cartharsis, an English-language online shop where people "buy" things without spending money. The catalog must feel like a real, desirable, premium-but-believable store for shoppers in the US and UK.

Hard rules:
- Every brand and product name is invented. Never use or closely imitate a real brand, trademark, or product line.
- Products are ordinary physical goods a person would plausibly buy online.
- Copy is in English, confident and specific. A little dry wit in blurbs is welcome; no emoji.

Fields:
- name: product name as shown on the shop, 2-5 words, may include a model word or number.
- brand: invented brand. Reuse a brand across a few products when it fits, like a real store.
- price_usd: realistic retail price in dollars, ending in .00, .50 or .99.
- compare_at_usd: a higher "was" price for about 1 in 4 products, otherwise null.
- rating: 3.8 to 4.9, one decimal. reviews: 12 to 6000, varied.
- blurb: one sentence, under 110 characters.
- details: exactly 4 short spec bullets (materials, sizes, capacities, battery life...).
- badge: for about 1 in 8 products one of "Bestseller", "New", "Limited", "Staff pick"; otherwise null.
- art_kind: the closest fallback illustration from the allowed list.
- hue: 0-359, a background colour that suits the product.
- image_prompt: what the product itself looks like: object, material, colour, shape, camera angle. 15-35 words. Describe only the product, never the background, surface, setting or lighting (the photo style is fixed elsewhere). No brand names, no text on the product, no people.`;

async function main() {
  loadEnv();
  const countArg = process.argv.indexOf("--count");
  const target = countArg > 0 ? Number(process.argv[countArg + 1]) : 500;
  if (!Number.isInteger(target) || target <= 0) throw new Error("--count must be a positive integer");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set (add it to .env.local).");
  const rows = readRows();
  const perCategory = Math.ceil(target / CATEGORIES.length);
  const takenSlugs = new Set([...PRODUCTS.map((p) => p.slug), ...rows.map((r) => r.slug)]);
  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });

  await mapLimit([...CATEGORIES], 5, async (category) => {
    const have = () => rows.filter((r) => r.category === category.slug);
    while (have().length < perCategory) {
      const want = Math.min(BATCH, perCategory - have().length);
      const existingNames = [...PRODUCTS.filter((p) => p.category === category.slug), ...have()].map((p) => p.name);
      const existingBrands = [...new Set(have().map((r) => r.brand))];

      const batch = await complete(
        apiKey,
        `Write ${want} new products for the "${category.name}" category. Typical price range: ${PRICE_HINTS[category.slug]}.
Cover a wide variety of product types within the category. Do not repeat or near-duplicate any of these existing products: ${existingNames.join("; ") || "(none yet)"}.
Brands already in use in this category (reuse some, invent others): ${existingBrands.join(", ") || "(none yet)"}.`,
        category.slug,
      );

      for (const p of batch.products.slice(0, want)) {
        rows.push(toRow(p, category.slug, takenSlugs));
      }
      fs.writeFileSync(CSV_PATH, toCsv(rows));
      console.log(`${category.slug}: ${have().length}/${perCategory}`);
    }
  });

  console.log(`\n${rows.length} rows in ${CSV_PATH}. Review/edit it, then run: pnpm catalog:build`);
}

const BATCH_SCHEMA = z.toJSONSchema(Batch, { target: "draft-7" });
delete BATCH_SCHEMA.$schema;

/** One OpenRouter chat completion constrained to the Batch JSON schema, retried on bad output. */
async function complete(apiKey: string, prompt: string, label: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Cartharsis catalog" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 16000,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_schema", json_schema: { name: "product_batch", strict: true, schema: BATCH_SCHEMA } },
          // Only route to providers that actually enforce the schema.
          provider: { require_parameters: true },
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 401) throw new AuthError();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${body?.error?.message ?? res.statusText}`);
      const choice = body?.choices?.[0];
      if (choice?.finish_reason === "length") throw new Error("response hit max_tokens");
      return Batch.parse(JSON.parse(choice?.message?.content ?? ""));
    } catch (err) {
      if (err instanceof AuthError || attempt >= MAX_ATTEMPTS) throw err;
      console.warn(`${label}: attempt ${attempt} failed (${err instanceof Error ? err.message : err}), retrying...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

class AuthError extends Error {
  constructor() {
    super("Invalid OPENROUTER_API_KEY (check .env.local).");
  }
}

function toRow(p: z.infer<typeof Batch>["products"][number], category: string, taken: Set<string>): Row {
  const base = p.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  taken.add(slug);

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const price = Math.max(1, p.price_usd);
  return {
    slug,
    name: p.name.trim(),
    brand: p.brand.trim(),
    category,
    price_usd: price.toFixed(2),
    compare_at_usd: p.compare_at_usd && p.compare_at_usd > price ? p.compare_at_usd.toFixed(2) : "",
    rating: clamp(p.rating, 1, 5).toFixed(1),
    reviews: String(Math.max(0, Math.round(p.reviews))),
    blurb: p.blurb.trim(),
    details: p.details.map((d) => d.replaceAll("|", "/").trim()).join(DETAILS_SEP),
    badge: p.badge?.trim() ?? "",
    art_kind: p.art_kind,
    hue: String(((Math.round(p.hue) % 360) + 360) % 360),
    image_prompt: p.image_prompt.trim(),
  };
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
