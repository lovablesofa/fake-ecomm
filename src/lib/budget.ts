import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "./db";
import { MONTHLY_BUDGET_USD, type Currency } from "./config";
import { convert } from "./money";

// $500 becomes £400 / €460: converted, then rounded to a whole 10 so it reads like a set allowance.
export function monthlyBudget(currency: Currency) {
  return Math.round(convert(MONTHLY_BUDGET_USD, "USD", currency) / 1000) * 1000;
}

/** Pretend money left this calendar month. Resets on the 1st. */
export async function userBudget(userId: string, currency: Currency, now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const orders = await db
    .select({ total: schema.orders.total, currency: schema.orders.currency })
    .from(schema.orders)
    .where(and(eq(schema.orders.userId, userId), gte(schema.orders.placedAt, monthStart)));
  const limit = monthlyBudget(currency);
  const spent = orders.reduce((sum, o) => sum + convert(o.total, o.currency, currency), 0);
  return {
    limit,
    spent,
    remaining: Math.max(0, limit - spent),
    resetsOn: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}
