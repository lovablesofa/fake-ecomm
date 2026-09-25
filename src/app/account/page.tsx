import type { Metadata } from "next";
import Link from "next/link";
import { deleteAccount, logout } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { userBudget } from "@/lib/budget";
import { getCurrency } from "@/lib/cart";
import { categoryName } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { advanceOrders } from "@/lib/orders";
import { userSavings } from "@/lib/savings";

export const metadata: Metadata = { title: "Money kept" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  await advanceOrders(user.id);
  const currency = await getCurrency();
  const [s, budget, { error }] = await Promise.all([userSavings(user.id, currency), userBudget(user.id, currency), searchParams]);
  const money = (c: number) => formatMoney(c, currency);
  const maxCat = s.byCategory[0]?.[1] ?? 1;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10">
      <p className="text-sm text-muted">{user.email}</p>
      <h1 className="font-display text-5xl">Money kept</h1>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-accent p-6 text-white sm:col-span-2">
          <p className="text-sm uppercase tracking-wider text-white/75">Total you didn&apos;t spend</p>
          <p className="mt-2 text-5xl font-semibold sm:text-6xl">{money(s.total)}</p>
          <p className="mt-3 text-white/80">
            Across {s.orders} {s.orders === 1 ? "order" : "orders"} and {s.items} {s.items === 1 ? "item" : "items"}.
            {s.total > 0 && <> Invested at 7% a year, that&apos;s about <strong>{money(s.investedIn10y)}</strong> in 10 years.</>}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Pretend budget left this month</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{money(budget.remaining)}</p>
          <div className="mt-3 h-2 rounded-full bg-stone-100">
            <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.min(100, (budget.spent / budget.limit) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {money(budget.spent)} of {money(budget.limit)} used · resets {budget.resetsOn.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          </p>
          <Link href="/orders" className="mt-4 inline-block text-sm underline underline-offset-4">View orders</Link>
        </div>
      </section>

      {s.orders === 0 ? (
        <p className="mt-10 text-muted">Nothing yet. <Link href="/shop" className="text-ink underline">Place your first pretend order.</Link></p>
      ) : (
        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-medium">Where the urge goes</h2>
            <ul className="mt-4 space-y-3">
              {s.byCategory.map(([cat, amount]) => (
                <li key={cat} className="text-sm">
                  <div className="flex justify-between"><span>{categoryName(cat)}</span><span className="text-muted">{money(amount)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-ink" style={{ width: `${(amount / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="font-medium">Did it take the edge off?</h2>
            {s.urge.after === null ? (
              <p className="mt-4 text-sm text-muted">After each delivery we ask whether it took the edge off the urge, from 1 to 5. Your answers show up here.</p>
            ) : (
              <>
                <p className="mt-4 text-4xl font-semibold tabular-nums">{s.urge.after.toFixed(1)}<span className="text-lg text-muted"> / 5</span></p>
                <p className="text-sm text-muted">
                  Average across {s.urge.answeredAfter} delivered {s.urge.answeredAfter === 1 ? "order" : "orders"}.
                  {s.urge.before !== null && <> Urge at checkout averaged {s.urge.before.toFixed(1)} / 5.</>}
                </p>
              </>
            )}
          </div>
        </section>
      )}

      <section className="mt-16 border-t border-line pt-8">
        <h2 className="font-medium">Account</h2>
        <p className="mt-2 text-sm text-muted">
          Something you&apos;d change? <Link href="/feedback" className="text-ink underline underline-offset-4">Send us feedback</Link>.
        </p>
        <form action={logout} className="mt-4">
          <SubmitButton className="btn-secondary">Sign out</SubmitButton>
        </form>
        <details className="mt-8 max-w-md text-sm">
          <summary className="cursor-pointer text-muted">Delete account and all data</summary>
          <form action={deleteAccount} className="mt-4 space-y-3">
            <p className="text-muted">This permanently deletes your account, orders and email history. Type DELETE to confirm.</p>
            <input name="confirm" className="input" autoComplete="off" aria-label="Type DELETE to confirm" />
            {error === "confirm" && <p className="text-red-600">Type DELETE in capitals to confirm.</p>}
            <SubmitButton className="rounded-full bg-red-600 px-5 py-2.5 font-medium text-white">Delete my account</SubmitButton>
          </form>
        </details>
      </section>
    </div>
  );
}
