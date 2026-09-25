import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import type { Currency } from "./config";
import { convert } from "./money";

export async function communitySaved(currency: Currency) {
  const rows = await db.select({ total: schema.orders.total, currency: schema.orders.currency }).from(schema.orders);
  return {
    total: rows.reduce((sum, r) => sum + convert(r.total, r.currency, currency), 0),
    orders: rows.length,
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
    reflections: {
      gladIDidnt: orders.filter((o) => o.reflection === "glad_i_didnt").length,
      stillWant: orders.filter((o) => o.reflection === "still_want").length,
    },
    // What the kept money could become at 7%/yr, compounded, over 10 years.
    investedIn10y: Math.round(total * Math.pow(1.07, 10)),
  };
}
