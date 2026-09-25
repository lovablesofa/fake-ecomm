import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { getCurrency } from "@/lib/cart";
import { PRODUCTS } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { communitySaved } from "@/lib/savings";

export default async function Home({ searchParams }: PageProps<"/">) {
  const currency = await getCurrency();
  const [community, { deleted }] = await Promise.all([communitySaved(currency), searchParams]);
  const featured = PRODUCTS.filter((p) => p.badge).slice(0, 4);

  return (
    <>
      {deleted && (
        <p className="bg-accent-soft px-4 py-3 text-center text-sm text-accent">Your account and all its data have been deleted.</p>
      )}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">The store that doesn&apos;t charge you</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Shop everything.
            <br />
            <em>Spend nothing.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Fill your bag, check out, get the confirmation email, and watch the package move across the map. You get the
            whole rush of buying, and the money stays in your account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">Start shopping</Link>
            <Link href="/how-it-works" className="btn-secondary">How it works</Link>
          </div>
          {community.orders > 0 && (
            <p className="mt-8 text-sm text-muted">
              Shoppers here have kept <strong className="text-ink">{formatMoney(community.total, currency)}</strong> across{" "}
              {community.orders.toLocaleString("en-US")} {community.orders === 1 ? "order" : "orders"} they didn&apos;t really place.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {PRODUCTS.slice(0, 4).map((p, i) => (
            <ProductArt key={p.slug} {...p.art} image={p.image} alt={p.name} sizes="(max-width: 1024px) 50vw, 288px" className={`aspect-square rounded-3xl ${i % 2 ? "translate-y-8" : ""}`} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          {[
            ["1. Want it", "Browse and fill your bag the way you normally would. No budget, no guilt."],
            ["2. Check out", "Pay with a simulated card. The confirmation email lands in your inbox straight away."],
            ["3. Keep the money", "Track the package to your door, then decide whether you still want it."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="font-display text-2xl">{title}</h2>
              <p className="mt-2 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl">Everyone&apos;s adding these</h2>
          <Link href="/shop" className="text-sm underline underline-offset-4">Shop all</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} currency={currency} />
          ))}
        </div>
      </section>
    </>
  );
}
