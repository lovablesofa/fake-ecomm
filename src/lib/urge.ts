import { createHmac, timingSafeEqual } from "node:crypto";

// The delivery email links to a check-in page that works without signing in, so each link carries a signature
// of the order id. CRON_SECRET is already set in production; LINK_SECRET can replace it if it ever needs rotating.
function secret() {
  const value = process.env.LINK_SECRET ?? process.env.CRON_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("Set LINK_SECRET or CRON_SECRET to sign email links");
  return "dev-only-link-secret";
}

export function urgeToken(orderId: string) {
  return createHmac("sha256", secret()).update(`urge:${orderId}`).digest("base64url").slice(0, 32);
}

export function validUrgeToken(orderId: string, token: string) {
  const expected = Buffer.from(urgeToken(orderId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const urgePath = (orderId: string) => `/urge/${orderId}/${urgeToken(orderId)}`;

export const isUrgeScore = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;

/** What we say back after an answer, on the order page and the email check-in page. */
export function urgeReply(score: number, kept: string) {
  return score >= 4
    ? `Nice. The urge is handled and you kept ${kept}.`
    : "Thanks for being honest. If you still want it in 30 days, it's probably a real want. Put it on a list and come back.";
}
