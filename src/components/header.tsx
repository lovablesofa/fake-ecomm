import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { CATEGORIES, dealName, DEALS } from "@/lib/catalog";
import { BRAND } from "@/lib/config";
import { CurrencySelect } from "./currency-select";

export async function Header() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="bg-ink px-4 py-2 text-center text-xs text-white/90">
        Simulated store: nothing is charged and nothing ships. <Link href="/how-it-works" className="font-semibold text-sun underline underline-offset-2">That&apos;s the point.</Link>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/" className="whitespace-nowrap font-display text-xl leading-none text-accent sm:text-2xl">{BRAND.name}</Link>
        <div className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm sm:gap-4">
          <Link href="/how-it-works" className="hidden hover:underline sm:inline">How it works</Link>
          <CurrencySelect value={cart.currency} />
          {user ? (
            <>
              <Link href="/orders" className="hidden hover:underline sm:inline">Orders</Link>
              <Link href="/account" className="hover:underline">Account</Link>
            </>
          ) : (
            <Link href="/login" className="hover:underline">Sign in</Link>
          )}
          <Link href="/cart" className="relative inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-semibold text-white transition hover:bg-accent-strong">
            Bag
            <span className="min-w-5 rounded-full bg-sun px-1.5 text-center text-xs font-bold text-ink">{cart.count}</span>
          </Link>
        </div>
      </div>
      {/* Amazon-style department bar: deals first, then every category. Scrolls sideways on phones. */}
      <nav className="border-t border-line">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto whitespace-nowrap px-4 py-2 text-sm">
          {DEALS.map((d) => (
            <Link key={d} href={`/shop?deal=${d}`} className="rounded-full bg-deal-soft px-3 py-1 font-semibold text-deal hover:bg-deal hover:text-white">
              {dealName(d, cart.currency)}
            </Link>
          ))}
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className="rounded-full px-3 py-1 hover:bg-paper">{c.name}</Link>
          ))}
          <Link href="/shop" className="rounded-full px-3 py-1 hover:bg-paper">All</Link>
        </div>
      </nav>
    </header>
  );
}
