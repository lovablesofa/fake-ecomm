"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  consumeLoginToken,
  createLoginToken,
  destroySession,
  getCurrentUser,
  recentLoginTokenCount,
  safeNext,
} from "@/lib/auth";
import { userBudget } from "@/lib/budget";
import { clearCart, getCart, readCartEntries, setCurrencyCookie, writeCartEntries } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";
import { APP_URL, CART_LIMITS, COUNTRIES, isCurrency, SHIPPING } from "@/lib/config";
import { randomDigits } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { loginEmail } from "@/lib/email/templates";
import { formatMoney, localPrice } from "@/lib/money";
import { advanceOrders } from "@/lib/orders";
import { makeTrackingNumber, scheduleFor } from "@/lib/tracking";

// ---------- Cart ----------

export async function addToCart(_prev: unknown, formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const qty = Math.max(1, Math.min(CART_LIMITS.maxQty, Number(formData.get("quantity") ?? 1) || 1));
  if (!getProduct(slug)) return { ok: false as const, at: Date.now() };

  const entries = await readCartEntries();
  const existing = entries.find((e) => e.s === slug);
  if (existing) existing.q = Math.min(CART_LIMITS.maxQty, existing.q + qty);
  else if (entries.length < CART_LIMITS.maxLines) entries.push({ s: slug, q: qty });
  await writeCartEntries(entries);

  if (formData.get("intent") === "buy-now") redirect("/checkout");
  return { ok: true as const, at: Date.now() };
}

export async function updateCartQuantity(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const qty = Number(formData.get("quantity"));
  const entries = await readCartEntries();
  const next =
    Number.isInteger(qty) && qty > 0
      ? entries.map((e) => (e.s === slug ? { ...e, q: Math.min(CART_LIMITS.maxQty, qty) } : e))
      : entries.filter((e) => e.s !== slug);
  await writeCartEntries(next);
}

export async function setCurrency(formData: FormData) {
  const currency = formData.get("currency");
  if (isCurrency(currency)) await setCurrencyCookie(currency);
}

// ---------- Auth ----------

const emailSchema = z.email().max(254).transform((e) => e.trim().toLowerCase());

export async function requestLoginLink(_prev: unknown, formData: FormData) {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { error: "Please enter a valid email address." };
  const email = parsed.data;
  const next = safeNext(formData.get("next"));

  if ((await recentLoginTokenCount(email, 15)) >= 3) {
    return { error: "Too many sign-in links requested. Please check your inbox or try again in 15 minutes." };
  }

  const token = await createLoginToken(email, next);
  const link = `${APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: email, kind: "login", ...loginEmail(link) });
  redirect(`/login/check-email?email=${encodeURIComponent(email)}`);
}

export async function verifyLogin(formData: FormData) {
  const next = await consumeLoginToken(String(formData.get("token") ?? ""));
  redirect(next ?? "/login?error=expired");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ---------- Checkout ----------

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  line1: z.string().trim().min(3, "Enter a street address").max(120),
  city: z.string().trim().min(2, "Enter a city").max(60),
  postal: z.string().trim().min(2, "Enter a postcode").max(12),
  country: z.enum(COUNTRIES.map((c) => c.code) as [string, ...string[]]),
  shipping: z.enum(["standard", "express"]),
  // Optional 1-5 answer to "How strong is the urge to buy this right now?"
  urge: z.union([z.literal(""), z.coerce.number().int().min(1).max(5)]),
});

export type CheckoutState =
  | { error?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string> }
  | undefined;

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const raw = Object.fromEntries(
    ["name", "line1", "city", "postal", "country", "shipping", "urge"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    // Echo values back: React resets the form after an action runs.
    return { error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values: raw };
  }
  const input = parsed.data;

  const cart = await getCart();
  if (!cart.lines.length) return { error: "Your bag is empty.", values: raw };

  // A short pause so "authorising payment" feels like a real checkout.
  await new Promise((r) => setTimeout(r, 1400));

  const shipping = localPrice(SHIPPING[input.shipping].priceUsd, cart.currency);
  const budget = await userBudget(user.id, cart.currency);
  if (cart.subtotal + shipping > budget.remaining) {
    const money = (c: number) => formatMoney(c, cart.currency);
    const resets = budget.resetsOn.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    return {
      error: `This order is ${money(cart.subtotal + shipping)} but you have ${money(budget.remaining)} left this month. Remove something from your bag, or wait until ${resets} when your budget resets.`,
      values: raw,
    };
  }
  const placedAt = new Date();
  const orderId = crypto.randomUUID();

  await db.batch([
    db.insert(schema.orders).values({
      id: orderId,
      number: `CH-${randomDigits(7)}`,
      userId: user.id,
      currency: cart.currency,
      subtotal: cart.subtotal,
      shipping,
      total: cart.subtotal + shipping,
      shippingMethod: input.shipping,
      shipName: input.name,
      shipLine1: input.line1,
      shipCity: input.city,
      shipPostal: input.postal,
      shipCountry: input.country,
      trackingNumber: makeTrackingNumber(input.country, randomDigits(10)),
      urgeBefore: input.urge === "" ? null : input.urge,
      placedAt,
      ...scheduleFor(input.shipping, placedAt),
    }),
    db.insert(schema.orderItems).values(
      cart.lines.map((l) => ({
        id: crypto.randomUUID(),
        orderId,
        productSlug: l.product.slug,
        name: l.product.name,
        brand: l.product.brand,
        category: l.product.category,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        image: l.product.image ?? null,
      })),
    ),
  ]);

  await clearCart();
  // Sends the confirmation email (stage 0).
  await advanceOrders(user.id);
  redirect(`/orders/${orderId}?placed=1`);
}

// ---------- Orders & account ----------

export async function setUrgeAfter(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orderId = String(formData.get("orderId") ?? "");
  const score = Number(formData.get("score"));
  if (!Number.isInteger(score) || score < 1 || score > 5) return;
  await db
    .update(schema.orders)
    .set({ urgeAfter: score })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, user.id)));
  revalidatePath(`/orders/${orderId}`);
}

export async function deleteAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (formData.get("confirm") !== "DELETE") redirect("/account?error=confirm");

  const orderIds = (
    await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.userId, user.id))
  ).map((o) => o.id);

  await db.batch([
    db.delete(schema.orderItems).where(inArray(schema.orderItems.orderId, orderIds.length ? orderIds : [""])),
    db.delete(schema.orders).where(eq(schema.orders.userId, user.id)),
    db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id)),
    db.delete(schema.loginTokens).where(eq(schema.loginTokens.email, user.email)),
    db.delete(schema.emails).where(eq(schema.emails.to, user.email)),
    db.delete(schema.users).where(eq(schema.users.id, user.id)),
  ]);
  await destroySession();
  redirect("/?deleted=1");
}
