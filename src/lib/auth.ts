import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "./db";
import { randomToken, sha256 } from "./crypto";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;
const LOGIN_TOKEN_MINUTES = 20;

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

export async function createLoginToken(email: string, next: string) {
  const token = randomToken();
  await db.insert(schema.loginTokens).values({
    tokenHash: sha256(token),
    email,
    next: safeNext(next),
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000),
  });
  return token;
}

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
  const tokenHash = sha256(token);
  // Conditional update so a token can only be used once, even under concurrent requests.
  const consumed = await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.loginTokens.tokenHash, tokenHash),
        isNull(schema.loginTokens.usedAt),
        gt(schema.loginTokens.expiresAt, new Date()),
      ),
    )
    .returning();
  const row = consumed[0];
  if (!row) return null;

  let user = await db.select().from(schema.users).where(eq(schema.users.email, row.email)).get();
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ id: crypto.randomUUID(), email: row.email })
      .onConflictDoUpdate({ target: schema.users.email, set: { email: row.email } })
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
  return row.next;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}
