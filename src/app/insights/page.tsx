import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { currentStage, DELIVERED } from "@/lib/tracking";

export const metadata: Metadata = { title: "Urge check-ins" };

// Open to everyone in development; in production only to the emails in ADMIN_EMAILS (comma-separated).
function isAdmin(email: string) {
  if (process.env.NODE_ENV !== "production") return true;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

const SCORES = [1, 2, 3, 4, 5] as const;
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");
const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : "–");

function Bars({ values, title, low, high }: { values: number[]; title: string; low: string; high: string }) {
  const max = Math.max(1, ...SCORES.map((s) => values.filter((v) => v === s).length));
  return (
    <div className="card p-6">
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {SCORES.map((s) => {
          const n = values.filter((v) => v === s).length;
          return (
            <li key={s} className="grid grid-cols-[1.5rem_1fr_4rem] items-center gap-3 tabular-nums">
              <span className="text-muted">{s}</span>
              <div className="h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-ink" style={{ width: `${(n / max) * 100}%` }} /></div>
              <span className="text-right">{n} <span className="text-muted">({pct(n, values.length)})</span></span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex justify-between text-xs text-muted"><span>1 · {low}</span><span>5 · {high}</span></p>
    </div>
  );
}

export default async function Insights() {
  const user = await requireUser("/insights");
  if (!isAdmin(user.email)) notFound();

  const orders = await db.select().from(schema.orders);
  const delivered = orders.filter((o) => currentStage(o) === DELIVERED);
  const before = orders.map((o) => o.urgeBefore).filter((n): n is number => n !== null);
  const after = delivered.map((o) => o.urgeAfter).filter((n): n is number => n !== null);
  const paired = delivered.filter((o) => o.urgeBefore !== null && o.urgeAfter !== null);

  const tiles = [
    ["Orders", String(orders.length), `${delivered.length} delivered`],
    ["Answered before", pct(before.length, orders.length), `${before.length} of ${orders.length} orders`],
    ["Answered after", pct(after.length, delivered.length), `${after.length} of ${delivered.length} delivered`],
    ["Took the edge off", after.length ? `${avg(after)} / 5` : "–", "average after delivery"],
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10">
      <h1 className="font-display text-5xl">Urge check-ins</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Before: &quot;How strong is the urge to buy this right now?&quot; at checkout. After: &quot;Did this take the edge off the urge?&quot; once
        the order is delivered. A low answer rate makes the averages unreliable, so check it first.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <Bars values={before} title="Urge at checkout" low="Barely" high="I need it" />
        <Bars values={after} title="Took the edge off, after delivery" low="Not at all" high="Completely" />
      </section>

      <section className="card mt-4 overflow-x-auto p-6">
        <h2 className="font-medium">Relief by starting urge</h2>
        <p className="mt-1 text-sm text-muted">Orders with both answers ({paired.length}). Does it work for strong urges, or only for weak ones?</p>
        <table className="mt-4 w-full min-w-96 text-sm tabular-nums">
          <thead className="text-left text-muted">
            <tr><th className="py-2 font-normal">Urge at checkout</th><th className="font-normal">Orders</th><th className="font-normal">Avg. took the edge off</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {SCORES.map((s) => {
              const rows = paired.filter((o) => o.urgeBefore === s);
              return (
                <tr key={s}><td className="py-2">{s}</td><td>{rows.length}</td><td>{avg(rows.map((o) => o.urgeAfter!))}</td></tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
