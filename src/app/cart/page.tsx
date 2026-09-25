import type { Metadata } from "next";
import Link from "next/link";
import { updateCartQuantity } from "@/app/actions";
import { ProductArt } from "@/components/product-art";
import { getCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Your bag" };

export default async function CartPage() {
  const cart = await getCart();

  if (!cart.lines.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-muted">Go on, want something.</p>
        <Link href="/shop" className="btn-primary mt-8">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-display text-5xl">Your bag</h1>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {cart.lines.map((line) => (
            <li key={`${line.product.slug}:${line.option ?? ""}`} className="flex gap-4 py-5">
              <Link href={`/product/${line.product.slug}`} className="shrink-0">
                <ProductArt {...line.product.art} image={line.product.image} alt={line.product.name} sizes="112px" className="size-24 rounded-xl sm:size-28" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted">{line.product.brand}</p>
                    <Link href={`/product/${line.product.slug}`} className="font-medium hover:underline">{line.product.name}</Link>
                    {line.option && <p className="text-sm text-muted">{line.product.options?.label}: {line.option}</p>}
                  </div>
                  <p className="font-medium">{formatMoney(line.lineTotal, cart.currency)}</p>
                </div>
                <div className="mt-auto flex items-center gap-3 pt-3 text-sm">
                  <form action={updateCartQuantity} className="flex items-center rounded-full border border-line">
                    <input type="hidden" name="slug" value={line.product.slug} />
                    <input type="hidden" name="option" value={line.option ?? ""} />
                    <button name="quantity" value={line.quantity - 1} className="px-3 py-1" aria-label="Decrease quantity">−</button>
                    <span className="w-6 text-center">{line.quantity}</span>
                    <button name="quantity" value={line.quantity + 1} className="px-3 py-1 disabled:opacity-30" disabled={line.quantity >= 10} aria-label="Increase quantity">+</button>
                  </form>
                  <form action={updateCartQuantity}>
                    <input type="hidden" name="slug" value={line.product.slug} />
                    <input type="hidden" name="option" value={line.option ?? ""} />
                    <button name="quantity" value="0" className="text-muted underline underline-offset-2 hover:text-ink">Remove</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="card h-fit p-6 lg:mt-20">
        <h2 className="font-medium">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal ({cart.count} items)</dt><dd>{formatMoney(cart.subtotal, cart.currency)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>Calculated at checkout</dd></div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold">
          <span>Total</span><span>{formatMoney(cart.subtotal, cart.currency)}</span>
        </div>
        <Link href="/checkout" className="btn-primary mt-6 w-full">Checkout</Link>
        <p className="mt-3 text-center text-xs text-muted">You won&apos;t be charged. Ever.</p>
      </aside>
    </div>
  );
}
