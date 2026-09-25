import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { BRAND } from "@/lib/config";
import { CurrencySelect } from "./currency-select";

export async function Header() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="bg-ink px-4 py-2 text-center text-xs text-white/85">
        Simulated store: nothing is charged and nothing ships. <Link href="/how-it-works" className="underline underline-offset-2">That&apos;s the point.</Link>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:gap-6">
        <Link href="/" className="font-display text-2xl leading-none tracking-tight">{BRAND.name}</Link>
        <nav className="hidden gap-5 text-sm sm:flex">
          <Link href="/shop" className="hover:underline">Shop</Link>
          <Link href="/how-it-works" className="hover:underline">How it works</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm sm:gap-4">
          <CurrencySelect value={cart.currency} />
          {user ? (
            <Link href="/account" className="hover:underline">Account</Link>
          ) : (
            <Link href="/login" className="hover:underline">Sign in</Link>
          )}
          <Link href="/cart" className="relative inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-white">
            Bag
            <span className="min-w-5 rounded-full bg-white px-1.5 text-center text-xs font-semibold text-ink">{cart.count}</span>
          </Link>
        </div>
      </div>
      <nav className="flex gap-5 border-t border-line px-4 py-2 text-sm sm:hidden">
        <Link href="/shop">Shop</Link>
        <Link href="/how-it-works">How it works</Link>
        {user && <Link href="/orders">Orders</Link>}
      </nav>
    </header>
  );
}
