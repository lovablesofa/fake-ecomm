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
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-6">
        <Link href="/" className="whitespace-nowrap font-display text-base leading-none text-accent min-[380px]:text-lg sm:text-2xl">{BRAND.name}</Link>
        <div className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm sm:gap-4">
          <Link href="/how-it-works" className="hidden hover:underline sm:inline">How it works</Link>
          <CurrencySelect value={cart.currency} />
          {user ? (
            <>
              {/* Icons on phones, words from sm up, so the bag never gets pushed off screen. */}
              <Link href="/saved" aria-label="Saved" className="hover:underline">
                <svg viewBox="0 0 24 24" className="size-6 fill-none sm:hidden" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.5 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" /></svg>
                <span className="hidden sm:inline">Saved</span>
              </Link>
              <Link href="/orders" className="hidden hover:underline sm:inline">Orders</Link>
              <Link href="/account" aria-label="Account" className="hover:underline">
                <svg viewBox="0 0 24 24" className="size-6 fill-none sm:hidden" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                <span className="hidden sm:inline">Account</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="hover:underline">Sign in</Link>
          )}
          <Link href="/cart" aria-label={`Bag, ${cart.count} ${cart.count === 1 ? "item" : "items"}`} className="relative inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1.5 sm:gap-1.5 sm:px-3 font-semibold text-white transition hover:bg-accent-strong">
            <svg viewBox="0 0 24 24" className="size-5 fill-none sm:hidden" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
            <span className="hidden sm:inline">Bag</span>
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
