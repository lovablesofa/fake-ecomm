import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCurrency } from "@/lib/cart";
import { CATEGORIES, dealName, DEALS, matchesDeal, PRODUCTS, type DealSlug } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse fashion, beauty, accessories, home goods and tech from made-up brands. Check out for free: nothing is charged, nothing ships.",
};

const PER_PAGE = 50;

const SORTS = { featured: "Featured", "price-asc": "Price: low to high", "price-desc": "Price: high to low", rating: "Top rated" } as const;

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const deal = DEALS.find((d) => d === params.deal) as DealSlug | undefined;
  const sort = typeof params.sort === "string" && params.sort in SORTS ? (params.sort as keyof typeof SORTS) : "featured";
  const currency = await getCurrency();

  const products = PRODUCTS.filter((p) => (!category || p.category === category) && (!deal || matchesDeal(p, deal)));
  if (sort === "price-asc") products.sort((a, b) => a.priceUsd - b.priceUsd);
  if (sort === "price-desc") products.sort((a, b) => b.priceUsd - a.priceUsd);
  if (sort === "rating") products.sort((a, b) => b.rating - a.rating);

  const pages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const visible = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Changing category, deal or sort goes back to page 1.
  const href = (next: { category?: string; deal?: string; sort?: string; page?: number }) => {
    const q = new URLSearchParams();
    const c = "category" in next ? next.category : category;
    const d = "deal" in next ? next.deal : deal;
    const s = next.sort ?? sort;
    if (c) q.set("category", c);
    if (d) q.set("deal", d);
    if (s !== "featured") q.set("sort", s);
    if (next.page && next.page > 1) q.set("page", String(next.page));
    const str = q.toString();
    return str ? `/shop?${str}` : "/shop";
  };
  const categoryLabel = category && CATEGORIES.find((c) => c.slug === category)?.name;
  const title = [deal && dealName(deal, currency), categoryLabel].filter(Boolean).join(" in ") || "All products";
  const chip = (active: boolean, tone: "deal" | "accent" = "accent") =>
    `rounded-full border px-4 py-1.5 text-sm font-medium ${active ? (tone === "deal" ? "border-deal bg-deal text-white" : "border-accent bg-accent text-white") : "border-line bg-white"}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-1 text-sm text-muted">{products.length} results</p>
      {/* One scrollable row of chips on phones, wrapping on wider screens. */}
      <div className="-mx-4 mt-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {DEALS.map((d) => (
          <Link key={d} href={href({ deal: deal === d ? undefined : d })} className={chip(deal === d, "deal")}>{dealName(d, currency)}</Link>
        ))}
        <Link href={href({ category: undefined })} className={chip(!category)}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={href({ category: c.slug })} className={chip(category === c.slug)}>
            {c.name}
          </Link>
        ))}
      </div>
      <div className="-mx-4 mt-3 flex gap-4 overflow-x-auto whitespace-nowrap px-4 text-sm sm:mx-0 sm:justify-end sm:px-0">
        {Object.entries(SORTS).map(([key, label]) => (
          <Link key={key} href={href({ sort: key })} className={sort === key ? "font-semibold underline underline-offset-4" : "text-muted"}>{label}</Link>
        ))}
      </div>
      <div className="product-grid mt-6">
        {visible.map((p) => (
          <ProductCard key={p.slug} product={p} currency={currency} />
        ))}
      </div>
      {pages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-6 text-sm" aria-label="Pagination">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="hover:underline">← Previous</Link> : <span className="text-muted">← Previous</span>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="hover:underline">Next →</Link> : <span className="text-muted">Next →</span>}
        </nav>
      )}
    </div>
  );
}
