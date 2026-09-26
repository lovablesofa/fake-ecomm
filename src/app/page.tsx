import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { discountPct, Price } from "@/components/price";
import { StatsTicker } from "@/components/stats-ticker";
import { getCurrency } from "@/lib/cart";
import { monthlyBudget } from "@/lib/budget";
import { dealName, getProduct, matchesDeal, PRODUCTS, type Product } from "@/lib/catalog";
import { APP_URL, BRAND, CURRENCIES } from "@/lib/config";
import { formatMoney } from "@/lib/money";

// Hand-picked crowd-pleasers across categories. Slugs that leave the catalog just drop out.
const pick = (slugs: string[]) => slugs.map(getProduct).filter((p): p is Product => !!p);
const HERO = pick(["vionne-top-handle-bag", "sonvik-anc-headphones", "retro-runner-90", "figue-blanche-eau-de-parfum"]);
const FEATURED = pick(["okuda-m-ii-mirrorless-camera", "luna-crescent-mini-bag", "tallboy-40oz-tumbler", "mushroom-glass-lamp", "frog-squish-plush"]);
// The most-reviewed cheap things, and the deepest markdowns.
const UNDER = PRODUCTS.filter((p) => matchesDeal(p, "under-25")).sort((a, b) => b.reviews - a.reviews).slice(0, 10);
const DEALS = PRODUCTS.filter((p) => matchesDeal(p, "sale") && !UNDER.includes(p))
  .sort((a, b) => discountPct(b.priceUsd, b.compareAtUsd) - discountPct(a.priceUsd, a.compareAtUsd))
  .slice(0, 10);

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
          <p className="mt-6 max-w-md text-lg text-muted">
            Fill your bag, check out, and watch your package cross the map. You get the whole rush of buying. Your money
            stays exactly where it is.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">Start shopping</Link>
            <Link href="/how-it-works" className="btn-secondary">How it works</Link>
          </div>
          <StatsTicker currency={currency} locale={CURRENCIES[currency].locale} className="mt-8 text-sm font-medium text-ink" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {HERO.map((p, i) => (
            <Link key={p.slug} href={`/product/${p.slug}`} className={`group relative block overflow-hidden rounded-xl ${i % 2 ? "translate-y-8" : ""}`}>
              <ProductArt {...p.art} image={p.image} alt={p.name} sizes="(max-width: 1024px) 50vw, 288px" className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]" />
              {/* Price tags on the diagonal pair, so the hero reads as a shop without getting busy. */}
              {(i === 0 || i === 3) && (
                <span className="absolute bottom-3 left-3 right-3 flex flex-col rounded-lg bg-white/95 px-3 py-2 text-sm shadow-sm backdrop-blur sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <span className="truncate font-medium">{p.name}</span>
                  <Price usd={p.priceUsd} currency={currency} className="shrink-0" />
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {[
        { title: `${dealName("under-25", currency)}: treat yourself`, href: "/shop?deal=under-25", products: UNDER, tone: "text-deal" },
        { title: "Today's deals", href: "/shop?deal=sale", products: DEALS, tone: "text-deal" },
        { title: "Everyone's adding these", href: "/shop", products: FEATURED, tone: "" },
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
