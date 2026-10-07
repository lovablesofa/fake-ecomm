/**
 * One-off reminder for delivered orders whose urge check-in ("Did this take the edge off?") is unanswered.
 *
 *   npx tsx --env-file=.env.turso scripts/urge-reminder.ts          # dry run: lists recipients, sends nothing
 *   npx tsx --env-file=.env.turso scripts/urge-reminder.ts --send   # sends
 *
 * Needs the production DATABASE_URL/DATABASE_AUTH_TOKEN, the same CRON_SECRET (or LINK_SECRET) as production so the
 * links verify, APP_URL, and for --send RESEND_API_KEY and EMAIL_FROM. Admins (ADMIN_EMAILS) are skipped, and each
 * person gets one reminder ever, about their latest unanswered order.
 */

const send = process.argv.includes("--send");

const required = ["DATABASE_URL", "APP_URL", ...(send ? ["RESEND_API_KEY", "EMAIL_FROM"] : [])];
const missing = required.filter((k) => !process.env[k]);
if (!process.env.LINK_SECRET && !process.env.CRON_SECRET) missing.push("CRON_SECRET (or LINK_SECRET)");
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}. Example: APP_URL=https://windowspree.com EMAIL_FROM="WindowSpree <orders@windowspree.com>" npx tsx --env-file=.env.turso scripts/urge-reminder.ts`);
  process.exit(1);
}

async function main() {
  // Imported after the env check: the db client and APP_URL are read at import time.
  const { and, eq, isNull } = await import("drizzle-orm");
  const { db, schema } = await import("../src/lib/db");
  const { adminEmails, APP_URL } = await import("../src/lib/config");
  const { sendEmail } = await import("../src/lib/email/send");
  const { urgeReminderEmail } = await import("../src/lib/email/templates");
  const { DELIVERED } = await import("../src/lib/tracking");
  const { urgePath } = await import("../src/lib/urge");

  const KIND = "urge_reminder";

  const rows = await db
    .select({ order: schema.orders, email: schema.users.email })
    .from(schema.orders)
    .innerJoin(schema.users, eq(schema.users.id, schema.orders.userId))
    .where(and(isNull(schema.orders.urgeAfter), eq(schema.orders.notifiedStage, DELIVERED)));

  const reminded = new Set(
    (await db.select({ to: schema.emails.to }).from(schema.emails).where(eq(schema.emails.kind, KIND))).map((e) => e.to.toLowerCase()),
  );
  const admins = adminEmails();
  // Newest first, so a person with several unanswered orders is asked about the latest one only.
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of [...rows].sort((a, b) => b.order.placedAt.getTime() - a.order.placedAt.getTime())) {
    const key = r.email.toLowerCase();
    if (!admins.includes(key) && !reminded.has(key) && !latest.has(key)) latest.set(key, r);
  }
  const targets = [...latest.values()];

  console.log(`${rows.length} delivered without an answer, ${targets.length} people to remind (one email each; admins and already reminded skipped):`);
  for (const { order, email } of targets) console.log(`  #${order.number}  ${email}`);
  if (!targets.length) return;

  // A link signed with a different secret than production's would 404 for everyone, so check one before sending.
  const probe = `${APP_URL}${urgePath(targets[0].order.id)}`;
  const status = (await fetch(probe)).status;
  console.log(`Link check: ${probe} -> ${status}`);
  if (status !== 200) {
    console.error("The check-in link does not open in production. Is the deploy live, and is CRON_SECRET the production one?");
    process.exit(1);
  }

  if (!send) {
    console.log("\nDry run. Add --send to send.");
    return;
  }

  for (const { order, email } of targets) {
    const result = await sendEmail({ to: email, kind: KIND, ...urgeReminderEmail(order) });
    console.log(`  #${order.number}  ${email}  ${result}`);
    await new Promise((r) => setTimeout(r, 600)); // Resend allows 2 requests a second
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
