import { APP_URL, BRAND, SHIPPING, type Currency } from "../config";
import type { Order, OrderItem } from "../db/schema";
import { formatMoney } from "../money";

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const INK = "#1c1917";
const MUTED = "#78716c";
const ACCENT = "#0f766e";

function layout(preheader: string, body: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f5f5f4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${INK}">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="padding:28px 32px 8px;font-size:20px;font-weight:700;letter-spacing:-0.02em">${BRAND.name}</td></tr>
<tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:20px 32px;background:#fafaf9;border-top:1px solid #e7e5e4;font-size:12px;line-height:1.5;color:${MUTED}">
${BRAND.name} is a simulated store. No payment was taken and nothing will be shipped. You received this because you placed a pretend order at <a href="${APP_URL}" style="color:${MUTED}">${APP_URL.replace(/^https?:\/\//, "")}</a>.
</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:${INK};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${esc(label)}</a></p>`;
}

function itemsTable(order: Order, items: OrderItem[]) {
  const c = order.currency as Currency;
  const rows = items
    .map(
      (i) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #f0efee"><div style="font-weight:600">${esc(i.name)}</div><div style="color:${MUTED};font-size:13px">${esc(i.brand)} · Qty ${i.quantity}</div></td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #f0efee;white-space:nowrap">${formatMoney(i.unitPrice * i.quantity, c)}</td></tr>`,
    )
    .join("");
  const ship = SHIPPING[order.shippingMethod];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">${rows}
<tr><td style="padding:10px 0 2px;color:${MUTED}">Subtotal</td><td align="right" style="padding:10px 0 2px">${formatMoney(order.subtotal, c)}</td></tr>
<tr><td style="padding:2px 0;color:${MUTED}">${ship.label} shipping</td><td align="right" style="padding:2px 0">${order.shipping ? formatMoney(order.shipping, c) : "Free"}</td></tr>
<tr><td style="padding:8px 0;font-weight:700">Total</td><td align="right" style="padding:8px 0;font-weight:700">${formatMoney(order.total, c)}</td></tr>
</table>`;
}

function savedCallout(order: Order) {
  return `<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px 18px;margin:20px 0">
<div style="font-size:13px;color:${ACCENT};font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Money kept</div>
<div style="font-size:26px;font-weight:700;color:${ACCENT}">${formatMoney(order.total, order.currency as Currency)}</div>
<div style="font-size:13px;color:${MUTED}">Still in your account. Your card was never charged.</div></div>`;
}

const orderUrl = (order: Order) => `${APP_URL}/orders/${order.id}`;

export function loginEmail(link: string) {
  const text = `Sign in to ${BRAND.name}: ${link}\n\nThis link expires in 20 minutes. If you didn't request it, ignore this email.`;
  const html = layout(
    "Your sign-in link",
    `<h1 style="font-size:22px;margin:8px 0 12px">Sign in to ${BRAND.name}</h1>
<p>Tap the button below to sign in. The link expires in 20 minutes and can be used once.</p>
${button(link, "Sign in")}
<p style="color:${MUTED};font-size:13px">If you didn't ask for this, you can ignore this email.</p>`,
  );
  return { subject: `Your ${BRAND.name} sign-in link`, html, text };
}

export function orderConfirmationEmail(order: Order, items: OrderItem[]) {
  const c = order.currency as Currency;
  const subject = `Order confirmed: #${order.number}`;
  const text = `Thanks for your order #${order.number}. Total: ${formatMoney(order.total, c)} (simulated, not charged).\nTrack it: ${orderUrl(order)}`;
  const html = layout(
    `Order #${order.number} is confirmed. ${formatMoney(order.total, c)}, not charged.`,
    `<h1 style="font-size:22px;margin:8px 0 4px">Thanks, ${esc(order.shipName.split(" ")[0])}! Your order is confirmed.</h1>
<p style="color:${MUTED};margin:0">Order #${order.number} · Payment approved (simulated)</p>
${itemsTable(order, items)}
<p style="margin:0;font-size:14px"><strong>Shipping to</strong><br>${esc(order.shipName)}<br>${esc(order.shipLine1)}<br>${esc(order.shipCity)} ${esc(order.shipPostal)}</p>
${savedCallout(order)}
${button(orderUrl(order), "Track your order")}`,
  );
  return { subject, html, text };
}

const STAGE_COPY = {
  1: {
    subject: (o: Order) => `Your order #${o.number} has shipped`,
    heading: "Your order is on its way",
    body: (o: Order) =>
      `Your package just left our warehouse with ${BRAND.carrier}. Tracking number <strong>${o.trackingNumber}</strong>.`,
  },
  3: {
    subject: (o: Order) => `Out for delivery today: #${o.number}`,
    heading: "Out for delivery",
    body: (o: Order) => `Your package is on the van in ${esc(o.shipCity)} and should arrive today.`,
  },
  4: {
    subject: (o: Order) => `Delivered: #${o.number}`,
    heading: "Your order has been delivered",
    body: () =>
      `It's at your door. Well, not really. But the money is still in your account, and that's the part that lasts.<br><br>One quick question on the order page: <strong>did this take the edge off the urge?</strong> It takes two seconds.`,
  },
} as const;

export function trackingEmail(order: Order, stage: 1 | 3 | 4) {
  const copy = STAGE_COPY[stage];
  const subject = copy.subject(order);
  const text = `${copy.heading}. Order #${order.number}. ${orderUrl(order)}`;
  const html = layout(
    subject,
    `<h1 style="font-size:22px;margin:8px 0 12px">${copy.heading}</h1>
<p>${copy.body(order)}</p>
${stage === 4 ? savedCallout(order) : ""}
${button(orderUrl(order), stage === 4 ? "Answer one question" : "Track package")}`,
  );
  return { subject, html, text };
}
