import { BRAND, APP_URL } from "@/lib/config";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";

// Plain-markdown summary for LLMs (https://llmstxt.org). Built from the catalog so it never goes stale.
export function GET() {
  const body = `# ${BRAND.name}

> ${BRAND.name} is a free online store where nothing costs anything. Shoppers browse, fill a bag, check out with a simulated payment ("Pretend Pay"), and get real order confirmation and tracking emails, but no card is ever asked for, nothing is charged and nothing ships. It is designed to satisfy the urge to shop impulsively without spending money. Tagline: "${BRAND.tagline}"

Key facts:

- Free to use. Each account gets a monthly budget of pretend money to spend.
- No payment details are collected; the checkout is a simulation from start to finish.
- Every brand and product in the catalog is fictional (${PRODUCTS.length} products across ${CATEGORIES.map((c) => c.name.toLowerCase()).join(", ")}).
- Orders are "shipped" by ${BRAND.carrier}, a fictional carrier, with tracking updates on a realistic timeline.
- After delivery, shoppers are asked whether they still want the item, to tell impulse from real need.
- Available in English, with prices in USD, GBP and EUR, for shoppers in the US, UK and Europe.
- It is not a treatment for shopping addiction; the site points people with debt or compulsive-spending problems to free professional advice (NFCC, StepChange, MABS).

## Main pages

- [How it works](${APP_URL}/how-it-works): the four steps (shop, check out, track, unbox) and an FAQ
- [Shop](${APP_URL}/shop): the full catalog

## Categories

${CATEGORIES.map((c) => `- [${c.name}](${APP_URL}/shop?category=${c.slug})`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
