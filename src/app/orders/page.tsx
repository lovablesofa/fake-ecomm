import type { Metadata } from "next";
import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { requireUser } from "@/lib/auth";
import { getProduct } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { getUserOrders } from "@/lib/orders";
import { currentStage, DELIVERED, STAGES } from "@/lib/tracking";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await getUserOrders(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <h1 className="font-display text-5xl">Your orders</h1>
      {!orders.length ? (
        <div className="mt-10 text-muted">
          No orders yet. <Link href="/shop" className="text-ink underline">Go want something.</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => {
            const stage = currentStage(o);
            return (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="card flex flex-wrap items-center gap-4 p-5 transition hover:border-ink">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((i) => {
                      const p = getProduct(i.productSlug);
                      const image = i.image ?? p?.image;
                      return image || p ? <ProductArt key={i.id} kind={p?.art.kind ?? "tote"} hue={p?.art.hue ?? 30} image={image ?? undefined} alt={i.name} sizes="56px" className="size-14 rounded-xl ring-2 ring-white" /> : null;
                    })}
                  </div>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">#{o.number}</p>
                    <p className="text-sm text-muted">
                      {o.placedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${stage === DELIVERED ? "bg-accent-soft text-accent" : "bg-stone-100"}`}>{STAGES[stage]}</span>
                  <span className="font-semibold">{formatMoney(o.total, o.currency)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
