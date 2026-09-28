import { randomInt } from "node:crypto";
import { and, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "./db";
import { randomToken, sha256 } from "./crypto";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;
const LOGIN_TOKEN_MINUTES = 20;
// With at most 3 codes per email every 15 minutes, 5 tries each leaves a 1-in-67,000 guess.
const MAX_CODE_ATTEMPTS = 5;

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .get();
  return row?.user ?? null;
});

export async function requireUser(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// Only allow same-site relative paths as post-login destinations.
export function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/";
}

/** A one-time link token plus a 6-digit code for the same sign-in, both sent in one email. */
export async function createLoginToken(email: string, next: string) {
  const token = randomToken();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.insert(schema.loginTokens).values({
    tokenHash: sha256(token),
    codeHash: codeHash(email, code),
    email,
    next: safeNext(next),
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000),
  });
  return { token, code };
}

const codeHash = (email: string, code: string) => sha256(`${email}:${code}`);

export async function recentLoginTokenCount(email: string, windowMinutes: number) {
  const rows = await db
    .select({ hash: schema.loginTokens.tokenHash })
    .from(schema.loginTokens)
    .where(
      and(
        eq(schema.loginTokens.email, email),
        gt(schema.loginTokens.createdAt, new Date(Date.now() - windowMinutes * 60_000)),
      ),
    );
  return rows.length;
}

/** Consumes a login token and starts a session. Returns the redirect target, or null if invalid. */
export async function consumeLoginToken(token: string) {
  // Conditional update so a token can only be used once, even under concurrent requests.
  const [row] = await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.loginTokens.tokenHash, sha256(token)), isNull(schema.loginTokens.usedAt), gt(schema.loginTokens.expiresAt, new Date())))
    .returning();
  if (!row) return null;
  await startSession(row.email);
  return row.next;
}

/**
 * Checks a 6-digit code against the email's live tokens and starts a session.
 * "ok" carries the redirect target; "locked" means every live code is out of attempts.
 */
export async function consumeLoginCode(email: string, code: string): Promise<{ status: "ok"; next: string } | { status: "wrong" | "locked" }> {
  const live = and(
    eq(schema.loginTokens.email, email),
    isNull(schema.loginTokens.usedAt),
    gt(schema.loginTokens.expiresAt, new Date()),
    lt(schema.loginTokens.codeAttempts, MAX_CODE_ATTEMPTS),
  );
  const [row] = await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(and(live, eq(schema.loginTokens.codeHash, codeHash(email, code))))
    .returning();
  if (row) {
    await startSession(row.email);
    return { status: "ok", next: row.next };
  }

  // A wrong guess counts against every code still open for this email, not just the newest.
  const open = await db.select({ hash: schema.loginTokens.tokenHash }).from(schema.loginTokens).where(live);
  if (!open.length) return { status: "locked" };
  await db
    .update(schema.loginTokens)
    .set({ codeAttempts: sql`${schema.loginTokens.codeAttempts} + 1` })
    .where(inArray(schema.loginTokens.tokenHash, open.map((o) => o.hash)));
  return { status: "wrong" };
}

async function startSession(email: string) {
  let user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ id: crypto.randomUUID(), email })
      .onConflictDoUpdate({ target: schema.users.email, set: { email } })
      .returning();
  }

  const sessionToken = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(schema.sessions).values({ id: sha256(sessionToken), userId: user.id, expiresAt });
  (await cookies()).set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}
