import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setUrgeAfter } from "@/app/actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { ProductArt } from "@/components/product-art";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { getProduct } from "@/lib/catalog";
import { BRAND, countryByCode, SHIPPING } from "@/lib/config";
import { formatMoney } from "@/lib/money";
import { getUserOrder } from "@/lib/orders";
import { currentStage, DELIVERED, STAGES, trackingEvents } from "@/lib/tracking";

export const metadata: Metadata = { title: "Order" };

const fmt = (d: Date) => d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/orders/${id}`);
  const order = await getUserOrder(user.id, id);
  if (!order) notFound();

  const stage = currentStage(order);
  const events = trackingEvents(order).filter((e) => e.done).reverse();
  const money = (c: number) => formatMoney(c, order.currency);
  const eta = stage < DELIVERED ? order.deliversAt : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10">
      {stage < DELIVERED && <AutoRefresh seconds={30} />}
      {placed && (
        <div className="mb-8 rounded-2xl bg-accent-soft p-6 text-center">
          <p className="text-4xl">✓</p>
          <h1 className="mt-2 font-display text-4xl">Payment approved. Order placed!</h1>
          <p className="mt-2 text-muted">A confirmation email is on its way to {user.email}. You were charged {money(0)}.</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/orders" className="text-sm text-muted hover:underline">← All orders</Link>
          <h2 className="mt-2 font-display text-4xl">Order #{order.number}</h2>
          <p className="text-sm text-muted">Placed {fmt(order.placedAt)}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-muted">{BRAND.carrier}</p>
          <p className="font-mono">{order.trackingNumber}</p>
        </div>
      </div>

      <section className="card mt-8 p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">{STAGES[stage]}</h3>
          {eta && <p className="text-sm text-muted">Estimated delivery: {fmt(eta)}</p>}
        </div>
        <ol className="mt-6 grid grid-cols-5 gap-2">
          {STAGES.map((label, i) => (
            <li key={label} className="text-xs sm:text-sm">
              <div className={`h-2 rounded-full ${i <= stage ? "bg-accent" : "bg-stone-200"}`} />
              <p className={`mt-2 ${i <= stage ? "font-medium" : "text-muted"}`}>{label}</p>
            </li>
          ))}
        </ol>
        <ol className="mt-8 space-y-5 border-l-2 border-line pl-6">
          {events.map((e, i) => (
            <li key={e.title} className="relative">
              <span className={`absolute -left-[31px] top-1.5 size-3 rounded-full ${i === 0 ? "bg-accent ring-4 ring-accent-soft" : "bg-stone-300"}`} />
              <p className="font-medium">{e.title}</p>
              <p className="text-sm text-muted">{e.location} · {fmt(e.at)}</p>
            </li>
          ))}
        </ol>
      </section>

      {stage === DELIVERED && (
        <section className="card mt-6 p-6">
          <h3 className="font-display text-3xl">Did this take the edge off the urge?</h3>
          {order.urgeAfter ? (
            <p className="mt-3 text-muted">
              You answered {order.urgeAfter} out of 5. {order.urgeAfter >= 4
                ? `Nice. The urge is handled and you kept ${money(order.total)}.`
                : "Thanks for being honest. If you still want it in 30 days, it's probably a real want. Put it on a list and come back."}
            </p>
          ) : (
            <form action={setUrgeAfter} className="mt-5">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <SubmitButton key={n} name="score" value={String(n)} className="btn-secondary min-w-14 tabular-nums">{n}</SubmitButton>
                ))}
              </div>
              <p className="mt-2 flex max-w-72 justify-between text-xs text-muted"><span>1 · Not at all</span><span>5 · Completely</span></p>
            </form>
          )}
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <h3 className="font-medium">Items</h3>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((i) => {
              const p = getProduct(i.productSlug);
              const image = i.image ?? p?.image;
              return (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  {(image || p) && <ProductArt kind={p?.art.kind ?? "tote"} hue={p?.art.hue ?? 30} image={image ?? undefined} alt={i.name} sizes="64px" className="size-16 rounded-xl" />}
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted">{i.brand}</p>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-sm text-muted">Qty {i.quantity}</p>
                  </div>
                  <p>{money(i.unitPrice * i.quantity)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{SHIPPING[order.shippingMethod].label} shipping</dt><dd>{order.shipping ? money(order.shipping) : "Free"}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          </dl>
        </section>
        <aside className="space-y-6">
          <div className="rounded-2xl bg-accent p-6 text-white">
            <p className="text-sm uppercase tracking-wider text-white/75">Money kept</p>
            <p className="mt-1 text-4xl font-semibold">{money(order.total)}</p>
            <p className="mt-2 text-sm text-white/80">Still in your account.</p>
          </div>
          <div className="card p-6 text-sm">
            <h3 className="font-medium">Shipping to</h3>
            <p className="mt-2 text-muted">
              {order.shipName}<br />{order.shipLine1}<br />{order.shipCity} {order.shipPostal}<br />{countryByCode(order.shipCountry)?.name}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
