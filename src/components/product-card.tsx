import Link from "next/link";
import type { Product } from "@/lib/catalog";
import type { Currency } from "@/lib/config";
import { discountPct, Price } from "./price";
import { ProductArt } from "./product-art";
import { Stars } from "./stars";

export function ProductCard({ product, currency }: { product: Product; currency: Currency }) {
  const off = discountPct(product.priceUsd, product.compareAtUsd);
  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col rounded-xl bg-white p-2 ring-1 ring-line transition hover:shadow-md hover:ring-ink/20">
      <div className="relative overflow-hidden rounded-lg">
        <ProductArt {...product.art} image={product.image} alt={product.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 224px" className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]" />
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
  );
}
