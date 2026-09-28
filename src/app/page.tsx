import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { Price } from "@/components/price";
import { StatsTicker } from "@/components/stats-ticker";
import { getCurrency } from "@/lib/cart";
import { monthlyBudget } from "@/lib/budget";
import { dealName, getProduct, PRODUCTS, type Product } from "@/lib/catalog";
import { APP_URL, BRAND, CURRENCIES, type Currency } from "@/lib/config";
import { formatMoney } from "@/lib/money";

// Picks follow the page-view analytics: the most-visited product pages go up front. Slugs that leave the catalog just drop out.
const pick = (slugs: string[]) => slugs.map(getProduct).filter((p): p is Product => !!p);
const HERO = pick(["vionne-top-handle-bag", "frog-squish-plush", "sundrop-linen-dress", "velvet-matte-lipstick"]);
// The moving hero strip: the four strongest photos first, then more of the most-viewed.
const STRIP = [...HERO, ...pick([
  "axolotl-cuddle-plush", "camden-tote", "plumping-lip-gloss", "peak-chelsea-boot", "retro-handheld-game-keychain",
  "coventry-chronograph-41", "pastel-heart-sunglasses", "larkspur-wrap-jumpsuit", "mushroom-glass-lamp", "sonvik-buds-pro",
])];
// Cheap things shoppers actually opened, mixed with the newest impulse buys.
const UNDER = pick([
  "axolotl-cuddle-plush", "fluffy-brow-gel", "plumping-lip-gloss", "mini-waffle-maker", "retro-handheld-game-keychain",
  "milky-rice-toner", "fuzzy-house-slippers", "fermented-rice-cleansing-oil", "pastel-heart-sunglasses", "cloud-night-light",
]);
const FEATURED = pick([
  "camden-tote", "coventry-chronograph-41", "sonvik-buds-pro", "alder-oak-teapot-32oz", "solaris-aviator-sunglasses",
  "skyloft-action-cam-5", "jasmine-night-candle", "foulard-silk-scarf", "desert-bloom-potted-plant", "tidewell-stoneware-bottle",
]);
// Fashion at $75-200 draws the most views per product: the aspirational-but-reachable band.
// The most-visited ones lead, the most-reviewed fill the row.
const shown = new Set([...HERO, ...UNDER, ...FEATURED]);
const FASHION_PICKS = pick(["larkspur-wrap-jumpsuit", "cashmere-crewneck-sweater", "peak-chelsea-boot", "halcyon-anorak", "reversible-ripstop-puffer"]);
const FASHION = [
  ...FASHION_PICKS,
  ...PRODUCTS.filter((p) => p.category === "fashion" && p.priceUsd >= 7500 && p.priceUsd <= 20000 && !shown.has(p) && !FASHION_PICKS.includes(p))
    .sort((a, b) => b.reviews - a.reviews),
].slice(0, 10);

/**
 * A row of products that slides forever. The list is rendered twice and slides by half, so the loop has no seam;
 * the second copy is hidden from screen readers and the tab order. Hover or focus pauses it.
 */
function Strip({ products, currency, card, named, reverse }: { products: Product[]; currency: Currency; card: string; named?: boolean; reverse?: boolean }) {
  return (
    <div className={`marquee flex w-max ${reverse ? "marquee-reverse" : ""}`}>
      {[...products, ...products].map((p, i) => {
        const copy = i >= products.length;
        return (
          // Padding instead of gap: each half has to be exactly 50% wide for the loop to line up.
          <Link key={i} href={`/product/${p.slug}`} aria-hidden={copy || undefined} tabIndex={copy ? -1 : undefined} className={`group block shrink-0 ${card}`}>
            <span className="relative block overflow-hidden rounded-xl">
              <ProductArt {...p.art} image={p.image} alt={copy ? "" : p.name} eager={i < 3} sizes={named ? "240px" : "160px"} className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]" />
              {named ? (
                <span className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between gap-2 rounded-lg bg-white/95 px-3 py-2 text-sm shadow-sm backdrop-blur">
                  <span className="truncate font-medium">{p.name}</span>
                  <Price usd={p.priceUsd} currency={currency} className="shrink-0" />
                </span>
              ) : (
                <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-0.5 text-sm font-semibold shadow-sm">
                  <Price usd={p.priceUsd} currency={currency} />
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// Organization + WebSite only. No Product/Offer markup anywhere: nothing here is actually for sale.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: BRAND.name,
      url: APP_URL,
      logo: `${APP_URL}/icon.png`,
      slogan: BRAND.tagline,
      description: BRAND.description,
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      name: BRAND.name,
      url: APP_URL,
      description: BRAND.description,
      publisher: { "@id": `${APP_URL}/#organization` },
    },
  ],
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const currency = await getCurrency();
  const { deleted } = await searchParams;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      {deleted && (
        <p className="bg-accent-soft px-4 py-3 text-center text-sm text-accent">Your account and all its data have been deleted.</p>
      )}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-8 sm:pt-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
            All the spree.
            <br />
            <span className="text-accent">None of the bill.</span>
          </h1>
          <p className="mt-5 max-w-md text-balance text-xl text-muted">The whole rush of buying, without spending a cent.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/shop" className="btn-primary px-7 py-4 text-lg shadow-lg shadow-accent/25 sm:px-9">Start shopping</Link>
            <Link href="/how-it-works" className="btn-secondary">How it works</Link>
          </div>
          <StatsTicker currency={currency} locale={CURRENCIES[currency].locale} className="mt-8 max-w-md text-lg text-muted sm:text-xl" />
        </div>
        {/* On phones the products come first, so the first screen shows the shop, not just a headline. */}
        <div className="order-first -mx-4 overflow-hidden motion-reduce:overflow-x-auto lg:hidden">
          <Strip products={STRIP} currency={currency} card="w-40 pr-3" />
        </div>
        {/* Desktop: the headline stays put while two rows drift past in opposite directions, fading in at the edges. */}
        <div className="hidden space-y-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] motion-reduce:overflow-x-auto lg:block">
          <Strip products={STRIP.filter((_, i) => i % 2 === 0)} currency={currency} card="w-60 pr-4" named />
          <Strip products={STRIP.filter((_, i) => i % 2 === 1)} currency={currency} card="w-60 pr-4" named reverse />
        </div>
      </section>

      {[
        { title: `${dealName("under-25", currency)}: treat yourself`, href: "/shop?deal=under-25", products: UNDER, tone: "text-deal" },
        { title: "Everyone's adding these", href: "/shop", products: FEATURED, tone: "" },
        { title: "Wardrobe upgrades", href: "/shop?category=fashion", products: FASHION, tone: "" },
      ].map((row) => (
        <section key={row.href} className="mx-auto max-w-6xl px-4 pt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className={`font-display text-3xl ${row.tone}`}>{row.title}</h2>
            <Link href={row.href} className="shrink-0 text-sm font-semibold underline underline-offset-4">See all</Link>
          </div>
          <div className="product-grid mt-5">
            {row.products.map((p) => (
              <ProductCard key={p.slug} product={p} currency={currency} />
            ))}
          </div>
        </section>
      ))}
      <section className="mt-16 border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          {[
            ["1. Want it", `Browse and fill your bag the way you normally would, with ${formatMoney(monthlyBudget(currency), currency).replace(/\.00$/, "")} of pretend money to spend each month.`],
            ["2. Check out", "Pay with a simulated card. The confirmation email lands in your inbox straight away."],
            ["3. Keep the money", "Track the package to your door, then decide whether you still want it."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="font-display text-2xl">{title}</h2>
              <p className="mt-2 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
