import Link from "next/link";
import { BRAND } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm sm:grid-cols-3">
        <div>
          <p className="font-display text-xl">{BRAND.name}</p>
          <p className="mt-2 max-w-xs text-muted">{BRAND.tagline} A simulated store for the urge to buy.</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Shop</p>
          <Link href="/shop" className="block text-muted hover:text-ink">All products</Link>
          <Link href="/orders" className="block text-muted hover:text-ink">Your orders</Link>
          <Link href="/account" className="block text-muted hover:text-ink">Money kept</Link>
        </div>
        <div className="space-y-2">
          <p className="font-medium">About</p>
          <Link href="/how-it-works" className="block text-muted hover:text-ink">How it works</Link>
          <p className="text-muted">All brands and products are fictional. No payment is ever taken.</p>
        </div>
      </div>
    </footer>
  );
}
