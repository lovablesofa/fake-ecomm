import Link from "next/link";
import type { Product } from "@/lib/catalog";
import type { Currency } from "@/lib/config";
import { Price } from "./price";
import { ProductArt } from "./product-art";
import { Stars } from "./stars";

export function ProductCard({ product, currency }: { product: Product; currency: Currency }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl">
        <ProductArt {...product.art} image={product.image} alt={product.name} sizes="(max-width: 1024px) 50vw, 288px" className="aspect-square transition-transform duration-500 group-hover:scale-[1.03]" />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white">{product.badge}</span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted">{product.brand}</p>
        <h3 className="font-medium leading-snug group-hover:underline">{product.name}</h3>
        <Stars rating={product.rating} reviews={product.reviews} />
        <div>
          <Price usd={product.priceUsd} compareAtUsd={product.compareAtUsd} currency={currency} />
        </div>
      </div>
    </Link>
  );
}
