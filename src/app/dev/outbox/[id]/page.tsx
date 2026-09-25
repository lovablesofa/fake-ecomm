import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";

export default async function OutboxEmail({ params }: PageProps<"/dev/outbox/[id]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const email = await db.select().from(schema.emails).where(eq(schema.emails.id, (await params).id)).get();
  if (!email?.html) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 pt-10">
      <Link href="/dev/outbox" className="text-sm text-muted hover:underline">← Outbox</Link>
      <h1 className="mt-2 text-xl font-semibold">{email.subject}</h1>
      <p className="text-sm text-muted">To: {email.to}</p>
      <iframe srcDoc={email.html} title={email.subject} sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" className="mt-6 h-[800px] w-full rounded-xl border border-line bg-white" />
    </div>
  );
}
