import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { saveUrgeFromEmail } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { db, schema } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { isUrgeScore, urgeReply, validUrgeToken } from "@/lib/urge";

export const metadata: Metadata = { title: "Did this take the edge off?", robots: { index: false } };

// Opened from the delivery email, often in a mail app's browser with no session, so it never asks to sign in.
export default async function UrgeCheckInPage({ params, searchParams }: PageProps<"/urge/[orderId]/[token]">) {
  const { orderId, token } = await params;
  const { score, saved } = await searchParams;
  if (!validUrgeToken(orderId, token)) notFound();
  const order = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!order) notFound();

  const kept = formatMoney(order.total, order.currency);
  const picked = [1, 2, 3, 4, 5].find((n) => String(n) === score) ?? order.urgeAfter;

  if (saved && order.urgeAfter && isUrgeScore(order.urgeAfter)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:py-20">
        <p className="text-4xl">✓</p>
        <h1 className="mt-2 font-display text-4xl">Thanks, saved: {order.urgeAfter} out of 5</h1>
        <p className="mt-3 text-lg text-muted">{urgeReply(order.urgeAfter, kept)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">Keep shopping</Link>
          <Link href={`/orders/${order.id}`} className="btn-secondary">See order #{order.number}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
      <p className="text-sm text-muted">Order #{order.number} · {kept} kept</p>
      <h1 className="mt-2 font-display text-4xl">Did this take the edge off the urge?</h1>
      <p className="mt-3 text-muted">
        {order.urgeAfter && !score
          ? `You answered ${order.urgeAfter}. Tap another number to change it.`
          : picked
            ? `You picked ${picked} in the email. Tap it to save, or choose another.`
            : "Tap a number to save your answer."}
      </p>
      <form action={saveUrgeFromEmail} className="mt-6">
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <SubmitButton key={n} name="score" value={String(n)} className={`${n === picked ? "btn-primary" : "btn-secondary"} min-w-14 tabular-nums`}>{n}</SubmitButton>
          ))}
        </div>
        <p className="mt-2 flex max-w-72 justify-between text-xs text-muted"><span>1 · Not at all</span><span>5 · Completely</span></p>
      </form>
    </div>
  );
}
