import { desc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";

export default async function Outbox() {
  if (process.env.NODE_ENV === "production") notFound();
  const emails = await db.select().from(schema.emails).orderBy(desc(schema.emails.createdAt)).limit(100);
  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <h1 className="font-display text-4xl">Dev outbox</h1>
      <p className="mt-2 text-sm text-muted">Every email the app sent or would have sent. Only available in development.</p>
      <ul className="mt-6 divide-y divide-line border-y border-line text-sm">
        {emails.map((e) => (
          <li key={e.id} className="flex items-center gap-4 py-3">
            <span className={`rounded px-2 py-0.5 text-xs ${e.status === "failed" ? "bg-red-100 text-red-800" : e.status === "sent" ? "bg-accent-soft text-accent" : "bg-stone-100"}`}>{e.status}</span>
            <div className="flex-1">
              {e.html ? <Link href={`/dev/outbox/${e.id}`} className="font-medium hover:underline">{e.subject}</Link> : <span className="font-medium">{e.subject}</span>}
              <p className="text-muted">{e.to} · {e.kind}{e.error && ` · ${e.error}`}</p>
            </div>
            <span className="text-muted">{e.createdAt.toLocaleTimeString("en-GB")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
