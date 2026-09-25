import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { Currency } from "./config";
import { convert } from "./money";

/** Site-wide totals for the homepage ticker. Money is in `currency` cents. */
export async function communityStats(currency: Currency) {
  const [orders, [items]] = await Promise.all([
    db.select({ userId: schema.orders.userId, total: schema.orders.total, currency: schema.orders.currency, placedAt: schema.orders.placedAt }).from(schema.orders),
    db.select({ count: sql<number>`coalesce(sum(${schema.orderItems.quantity}), 0)` }).from(schema.orderItems),
  ]);
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sum = (rows: typeof orders) => rows.reduce((total, o) => total + convert(o.total, o.currency, currency), 0);
  return {
    shoppers: new Set(orders.map((o) => o.userId)).size,
    items: items.count,
    total: sum(orders),
    last30Days: sum(orders.filter((o) => o.placedAt.getTime() >= monthAgo)),
  };
}

export async function userSavings(userId: string, currency: Currency) {
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.userId, userId));
  const items = await db
    .select({ category: schema.orderItems.category, quantity: schema.orderItems.quantity, unitPrice: schema.orderItems.unitPrice, currency: schema.orders.currency })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(eq(schema.orders.userId, userId));

  const total = orders.reduce((sum, o) => sum + convert(o.total, o.currency, currency), 0);
  const byCategory = new Map<string, number>();
  for (const i of items) {
    byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + convert(i.unitPrice * i.quantity, i.currency, currency));
  }

  const now = new Date();
  const thisMonth = orders
    .filter((o) => o.placedAt.getMonth() === now.getMonth() && o.placedAt.getFullYear() === now.getFullYear())
    .reduce((sum, o) => sum + convert(o.total, o.currency, currency), 0);

  return {
    total,
    thisMonth,
    orders: orders.length,
    items: items.reduce((sum, i) => sum + i.quantity, 0),
    byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
    urge: {
      before: average(orders.map((o) => o.urgeBefore)),
      after: average(orders.map((o) => o.urgeAfter)),
      answeredAfter: orders.filter((o) => o.urgeAfter).length,
    },
    // What the kept money could become at 7%/yr, compounded, over 10 years.
    investedIn10y: Math.round(total * Math.pow(1.07, 10)),
  };
}

function average(scores: (number | null)[]) {
  const answered = scores.filter((n): n is number => n !== null);
  return answered.length ? answered.reduce((a, b) => a + b, 0) / answered.length : null;
}
