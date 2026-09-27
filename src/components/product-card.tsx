import Link from "next/link";
import type { Product } from "@/lib/catalog";
import type { Currency } from "@/lib/config";
import { getSavedSlugs } from "@/lib/saved";
import { discountPct, Price } from "./price";
import { ProductArt } from "./product-art";
import { SaveButton } from "./save-button";
import { Stars } from "./stars";

export async function ProductCard({ product, currency, eager }: { product: Product; currency: Currency; eager?: boolean }) {
  const off = discountPct(product.priceUsd, product.compareAtUsd);
  const saved = await getSavedSlugs();
  return (
    // The heart sits beside the link, not inside it: a form can't live inside an <a>.
    <div className="relative flex flex-col">
      <Link href={`/product/${product.slug}`} className="group flex flex-1 flex-col rounded-xl bg-white p-2 ring-1 ring-line transition hover:shadow-md hover:ring-ink/20">
        <div className="relative overflow-hidden rounded-lg">
          <ProductArt {...product.art} image={product.image} alt={product.name} eager={eager} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 224px" className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]" />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {off > 0 && <span className="rounded-md bg-deal px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>}
            {product.badge && <span className="rounded-md bg-sun px-2 py-0.5 text-xs font-semibold text-ink">{product.badge}</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-1 pb-1 pt-2">
          <h3 className="line-clamp-2 text-sm leading-snug group-hover:underline">
            <span className="text-muted">{product.brand}</span> {product.name}
          </h3>
          <Stars rating={product.rating} reviews={product.reviews} />
          <Price usd={product.priceUsd} compareAtUsd={product.compareAtUsd} currency={currency} className="mt-auto text-lg" />
          <p className="text-xs text-accent">Free delivery · Express tomorrow</p>
        </div>
      </Link>
      <SaveButton slug={product.slug} name={product.name} saved={saved && saved.has(product.slug)} className="absolute right-4 top-4" />
    </div>
  );
}
