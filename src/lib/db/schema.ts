import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});

export const loginTokens = sqliteTable(
  "login_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    email: text("email").notNull(),
    next: text("next").notNull().default("/"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("login_tokens_email_idx").on(t.email, t.createdAt)],
);

export const sessions = sqliteTable("sessions", {
  // sha256 of the cookie value
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currency: text("currency", { enum: ["USD", "GBP", "EUR"] }).notNull(),
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull(),
    total: integer("total").notNull(),
    shippingMethod: text("shipping_method", { enum: ["standard", "express"] }).notNull(),
    shipName: text("ship_name").notNull(),
    shipLine1: text("ship_line1").notNull(),
    shipCity: text("ship_city").notNull(),
    shipPostal: text("ship_postal").notNull(),
    shipCountry: text("ship_country").notNull(),
    trackingNumber: text("tracking_number").notNull(),
    placedAt: integer("placed_at", { mode: "timestamp_ms" }).notNull(),
    shipsAt: integer("ships_at", { mode: "timestamp_ms" }).notNull(),
    outForDeliveryAt: integer("out_for_delivery_at", { mode: "timestamp_ms" }).notNull(),
    deliversAt: integer("delivers_at", { mode: "timestamp_ms" }).notNull(),
    // Highest tracking stage we've emailed about (0 = confirmation).
    notifiedStage: integer("notified_stage").notNull().default(-1),
    // Legacy yes/no question, replaced by the urge scores below. Kept so old rows stay readable.
    reflection: text("reflection", { enum: ["still_want", "glad_i_didnt"] }),
    // 1-5, asked at checkout: "How strong is the urge to buy this right now?" Optional.
    urgeBefore: integer("urge_before"),
    // 1-5, asked after delivery: "Did this take the edge off the urge?"
    urgeAfter: integer("urge_after"),
  },
  (t) => [
    index("orders_user_idx").on(t.userId, t.placedAt),
    index("orders_pending_idx").on(t.notifiedStage),
  ],
);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productSlug: text("product_slug").notNull(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  // The chosen option at purchase time, already labelled, e.g. "Size: M".
  option: text("option"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  // Photo path at purchase time, so the order keeps its picture if the product leaves the catalog.
  image: text("image"),
});

export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  kind: text("kind").notNull(),
  // Only kept when the email was not handed to a provider (dev outbox).
  html: text("html"),
  status: text("status", { enum: ["sent", "logged", "failed"] }).notNull(),
  providerId: text("provider_id"),
  error: text("error"),
  createdAt: createdAt(),
});

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type User = typeof users.$inferSelect;
