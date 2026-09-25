import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { db, schema } from "./db";
import type { Order } from "./db/schema";
import { sendEmail } from "./email/send";
import { orderConfirmationEmail, trackingEmail } from "./email/templates";
import { currentStage, type Stage } from "./tracking";

export async function getUserOrders(userId: string) {
  await advanceOrders(userId);
  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.userId, userId))
    .orderBy(desc(schema.orders.placedAt));
  const items = orders.length
    ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orders.map((o) => o.id)))
    : [];
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
}

export async function getUserOrder(userId: string, orderId: string) {
  await advanceOrders(userId);
  const order = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)))
    .get();
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return { ...order, items };
}

async function recipientFor(order: Order) {
  const user = await db.select().from(schema.users).where(eq(schema.users.id, order.userId)).get();
  return user?.email ?? null;
}

/**
 * Sends the email for the latest reached stage of each order not yet notified.
 * Skips intermediate stages if several were reached at once, so users never get a burst.
 * Safe to run concurrently: the stage claim is a conditional update.
 */
export async function advanceOrders(userId?: string) {
  const now = new Date();
  const pending = await db
    .select()
    .from(schema.orders)
    .where(
      userId
        ? and(lt(schema.orders.notifiedStage, 3), eq(schema.orders.userId, userId))
        : lt(schema.orders.notifiedStage, 3),
    );

  let sent = 0;
  for (const order of pending) {
    const stage = currentStage(order, now);
    if (stage <= order.notifiedStage) continue;

    const claimed = await db
      .update(schema.orders)
      .set({ notifiedStage: stage })
      .where(and(eq(schema.orders.id, order.id), eq(schema.orders.notifiedStage, order.notifiedStage)))
      .returning({ id: schema.orders.id });
    if (!claimed.length) continue;

    const to = await recipientFor(order);
    if (!to) continue;
    if (stage === 0) {
      const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
      await sendEmail({ to, kind: "order_confirmed", ...orderConfirmationEmail(order, items) });
    } else {
      await sendEmail({ to, kind: `order_stage_${stage}`, ...trackingEmail(order, stage as Exclude<Stage, 0>) });
    }
    sent++;
  }
  return sent;
}
