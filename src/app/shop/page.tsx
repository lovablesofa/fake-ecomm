import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCurrency } from "@/lib/cart";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse fashion, beauty, accessories and home goods from made-up brands. Check out for free: nothing is charged, nothing ships.",
};

const PER_PAGE = 48;

const SORTS = { featured: "Featured", "price-asc": "Price: low to high", "price-desc": "Price: high to low", rating: "Top rated" } as const;

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const sort = typeof params.sort === "string" && params.sort in SORTS ? (params.sort as keyof typeof SORTS) : "featured";
  const currency = await getCurrency();

  const products = category ? PRODUCTS.filter((p) => p.category === category) : [...PRODUCTS];
  if (sort === "price-asc") products.sort((a, b) => a.priceUsd - b.priceUsd);
  if (sort === "price-desc") products.sort((a, b) => b.priceUsd - a.priceUsd);
  if (sort === "rating") products.sort((a, b) => b.rating - a.rating);

  const pages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const visible = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Changing category or sort goes back to page 1.
  const href = (next: { category?: string; sort?: string; page?: number }) => {
    const q = new URLSearchParams();
    const c = "category" in next ? next.category : category;
    const s = next.sort ?? sort;
    if (c) q.set("category", c);
    if (s !== "featured") q.set("sort", s);
    if (next.page && next.page > 1) q.set("page", String(next.page));
    const str = q.toString();
    return str ? `/shop?${str}` : "/shop";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-5xl">{category ? CATEGORIES.find((c) => c.slug === category)?.name : "All products"}</h1>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={href({ category: undefined })} className={`rounded-full border px-4 py-1.5 text-sm ${!category ? "border-accent bg-accent text-white" : "border-line"}`}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={href({ category: c.slug })} className={`rounded-full border px-4 py-1.5 text-sm ${category === c.slug ? "border-accent bg-accent text-white" : "border-line"}`}>
            {c.name}
          </Link>
        ))}
        <div className="-mx-4 flex w-full gap-4 overflow-x-auto whitespace-nowrap px-4 pt-2 text-sm sm:mx-0 sm:ml-auto sm:w-auto sm:px-0 sm:pt-0">
          {Object.entries(SORTS).map(([key, label]) => (
            <Link key={key} href={href({ sort: key })} className={sort === key ? "font-medium underline underline-offset-4" : "text-muted"}>{label}</Link>
          ))}
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {visible.map((p) => (
          <ProductCard key={p.slug} product={p} currency={currency} />
        ))}
      </div>
      {pages > 1 && (
        <nav className="mt-14 flex items-center justify-center gap-6 text-sm" aria-label="Pagination">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="hover:underline">← Previous</Link> : <span className="text-muted">← Previous</span>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="hover:underline">Next →</Link> : <span className="text-muted">Next →</span>}
        </nav>
      )}
    </div>
  );
}
