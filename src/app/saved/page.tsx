import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { requireUser } from "@/lib/auth";
import { getCurrency } from "@/lib/cart";
import { getSavedProducts } from "@/lib/saved";

export const metadata: Metadata = { title: "Saved for later" };

export default async function SavedPage() {
  await requireUser("/saved");
  const [currency, products] = await Promise.all([getCurrency(), getSavedProducts()]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-display text-5xl">Saved for later</h1>
      <p className="mt-3 max-w-xl text-muted">
        Things you wanted but didn&apos;t check out yet. When the urge comes back, they&apos;re right here.
      </p>
      {!products.length ? (
        <p className="mt-10 text-muted">
          Nothing saved yet. Tap the heart on anything you like. <Link href="/shop" className="text-ink underline">Browse the shop.</Link>
        </p>
      ) : (
        <div className="product-grid mt-8">
          {products.map((p) => <ProductCard key={p.slug} product={p} currency={currency} />)}
        </div>
      )}
    </div>
  );
}
