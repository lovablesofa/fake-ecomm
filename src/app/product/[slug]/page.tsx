import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { discountPct, Price } from "@/components/price";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { Stars } from "@/components/stars";
import { getCurrency } from "@/lib/cart";
import { categoryName, getProduct, PRODUCTS } from "@/lib/catalog";
import { BRAND, SHIPPING } from "@/lib/config";
import { formatMoney, localPrice } from "@/lib/money";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return { title: "Not found" };
  const description = `${product.blurb} A made-up ${product.brand} product you can "buy" on ${BRAND.name} without being charged.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { siteName: BRAND.name, type: "website", title: product.name, description, ...(product.image && { images: [product.image] }) },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const currency = await getCurrency();
  const related = PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 5);
  const off = discountPct(product.priceUsd, product.compareAtUsd);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <nav className="text-sm text-muted">
        <Link href="/shop" className="hover:underline">Shop</Link> /{" "}
        <Link href={`/shop?category=${product.category}`} className="hover:underline">{categoryName(product.category)}</Link>
      </nav>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductArt {...product.art} image={product.image} alt={product.name} eager sizes="(max-width: 1024px) 100vw, 576px" className="aspect-square rounded-xl" />
        <div className="lg:py-6">
          <p className="text-sm uppercase tracking-wider text-muted">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3"><Stars rating={product.rating} reviews={product.reviews} /></div>
          <div className="mt-5 flex items-center gap-3">
            {off > 0 && <span className="rounded-md bg-deal px-2 py-1 text-sm font-bold text-white">-{off}%</span>}
            <Price usd={product.priceUsd} compareAtUsd={product.compareAtUsd} currency={currency} className="text-3xl" />
          </div>
          <p className="mt-6 text-lg text-muted">{product.blurb}</p>
          <div className="mt-8"><AddToCart slug={product.slug} options={product.options} /></div>
          <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm">
            {product.details.map((d) => (
              <li key={d} className="flex gap-2"><span className="text-accent">✓</span>{d}</li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white p-4 ring-1 ring-line"><p className="font-medium">Free delivery</p><p className="text-muted">{SHIPPING.standard.eta}, or {SHIPPING.express.eta.replace("1 day", "tomorrow")} with Express ({formatMoney(localPrice(SHIPPING.express.priceUsd, currency), currency)})</p></div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-line"><p className="font-medium">Never charged</p><p className="text-muted">Payment is always simulated</p></div>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl">You might also want</h2>
          <div className="product-grid mt-6">
            {related.map((p) => <ProductCard key={p.slug} product={p} currency={currency} />)}
          </div>
        </section>
      )}
    </div>
  );
}
