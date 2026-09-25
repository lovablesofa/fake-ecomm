import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { Price } from "@/components/price";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { Stars } from "@/components/stars";
import { getCurrency } from "@/lib/cart";
import { categoryName, getProduct, PRODUCTS } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product?.name ?? "Not found" };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const currency = await getCurrency();
  const related = PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <nav className="text-sm text-muted">
        <Link href="/shop" className="hover:underline">Shop</Link> /{" "}
        <Link href={`/shop?category=${product.category}`} className="hover:underline">{categoryName(product.category)}</Link>
      </nav>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductArt {...product.art} image={product.image} alt={product.name} sizes="(max-width: 1024px) 100vw, 576px" className="aspect-square rounded-3xl" />
        <div className="lg:py-6">
          <p className="text-sm uppercase tracking-wider text-muted">{product.brand}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <div className="mt-3"><Stars rating={product.rating} reviews={product.reviews} /></div>
          <Price usd={product.priceUsd} compareAtUsd={product.compareAtUsd} currency={currency} className="mt-6 text-2xl" />
          <p className="mt-6 text-lg text-muted">{product.blurb}</p>
          <div className="mt-8"><AddToCart slug={product.slug} /></div>
          <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm">
            {product.details.map((d) => (
              <li key={d} className="flex gap-2"><span className="text-accent">✓</span>{d}</li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white p-4 ring-1 ring-line"><p className="font-medium">Free shipping</p><p className="text-muted">Arrives in 2–3 days, in theory</p></div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-line"><p className="font-medium">Never charged</p><p className="text-muted">Payment is always simulated</p></div>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl">You might also want</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.slug} product={p} currency={currency} />)}
          </div>
        </section>
      )}
    </div>
  );
}
