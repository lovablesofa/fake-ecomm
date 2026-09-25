import { Resend } from "resend";
import { db, schema } from "../db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Cartharsis <onboarding@resend.dev>";

type EmailInput = { to: string; subject: string; html: string; text: string; kind: string };

/** Sends via Resend when configured; otherwise logs to the dev outbox. Never throws. */
export async function sendEmail({ to, subject, html, text, kind }: EmailInput) {
  let status: "sent" | "logged" | "failed" = "logged";
  let providerId: string | null = null;
  let error: string | null = null;

  if (resend) {
    try {
      const res = await resend.emails.send({ from: FROM, to, subject, html, text });
      if (res.error) {
        status = "failed";
        error = res.error.message;
      } else {
        status = "sent";
        providerId = res.data?.id ?? null;
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  } else {
    console.log(`[email:${kind}] to=${to} subject="${subject}" (RESEND_API_KEY not set, see /dev/outbox)`);
  }

  if (error) console.error(`[email:${kind}] failed to send to ${to}: ${error}`);

  await db.insert(schema.emails).values({
    id: crypto.randomUUID(),
    to,
    subject,
    kind,
    html: status === "sent" ? null : html,
    status,
    providerId,
    error,
  });
  return status;
}
