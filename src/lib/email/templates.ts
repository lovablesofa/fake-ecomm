import { APP_URL, BRAND, countryByCode, SHIPPING, type Currency } from "../config";
import type { Product } from "../catalog";
import type { Feedback, Order, OrderItem } from "../db/schema";
import { formatMoney, localPrice } from "../money";
import { STAGES } from "../tracking";
import { urgePath } from "../urge";

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// The site's palette (globals.css). Email clients ignore CSS variables, so the values are repeated here.
const INK = "#16181d";
const MUTED = "#5b606b";
const LINE = "#e2e4e8";
const PAPER = "#f2f3f5";
const ACCENT = "#0d6e5a";
const ACCENT_SOFT = "#e3f1ec";
const DEAL = "#c2410c";
const SUN = "#fde047";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const SITE = APP_URL.replace(/^https?:\/\//, "");

/** A site link tagged with where it came from, so analytics can tell which email brought people back. */
function track(path: string, campaign: string) {
  const url = new URL(path, APP_URL);
  url.searchParams.set("utm_source", "email");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

const ORDER_FOOTER = `${BRAND.name} is a simulated store. No payment was taken and nothing will be shipped. You received this because you placed a pretend order at <a href="${APP_URL}" style="color:${MUTED}">${SITE}</a>.`;

function layout({ preheader, body, campaign, notice = "Pretend order · nothing charged, nothing ships", footer = ORDER_FOOTER }: {
  preheader: string;
  body: string;
  campaign: string;
  notice?: string;
  footer?: string;
}) {
  const nav = [["Shop", "/shop"], ["Saved", "/saved"], ["Money kept", "/account"], ["Feedback", "/feedback"]]
    .map(([label, path]) => `<a href="${track(path, campaign)}" style="color:${INK};text-decoration:none;font-weight:600">${label}</a>`)
    .join(`<span style="color:${LINE}">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`);
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only">
<style>@media (max-width:480px){.px{padding-left:20px!important;padding-right:20px!important}}</style></head>
<body style="margin:0;background:${PAPER};font-family:${FONT};color:${INK}">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE}">
<tr><td style="background:${INK};color:#e8e9ec;font-size:12px;text-align:center;padding:8px 16px">${notice}</td></tr>
<tr><td class="px" style="background:${ACCENT};padding:22px 32px">
<a href="${track("/", campaign)}" style="color:#ffffff;text-decoration:none;font-size:24px;font-weight:800;letter-spacing:-0.02em">${BRAND.name}</a>
<div style="color:${SUN};font-size:13px;font-weight:600;margin-top:2px">${BRAND.tagline}</div>
</td></tr>
<tr><td class="px" style="padding:28px 32px 32px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid ${LINE};font-size:13px;text-align:center">${nav}</td></tr>
<tr><td style="padding:16px 32px 22px;background:${PAPER};font-size:12px;line-height:1.5;color:${MUTED};text-align:center">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string, color = ACCENT) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${color};border-radius:999px">
<a href="${href}" style="display:inline-block;color:#ffffff;text-decoration:none;padding:13px 26px;font-weight:700;font-size:15px">${esc(label)}</a></td></tr></table>`;
}

function heading(title: string, sub?: string) {
  return `<h1 style="font-size:26px;line-height:1.2;margin:0 0 6px;font-weight:800;letter-spacing:-0.02em">${title}</h1>${sub ? `<p style="color:${MUTED};margin:0">${sub}</p>` : ""}`;
}

function sectionTitle(title: string) {
  return `<h2 style="font-size:17px;margin:32px 0 12px;font-weight:800">${title}</h2>`;
}

const orderUrl = (order: Order, campaign: string) => track(`/orders/${order.id}`, campaign);

function arrivalDate(order: Order) {
  const timeZone = countryByCode(order.shipCountry)?.timeZone;
  return order.deliversAt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone });
}

/** Five-step bar like the order page: green up to the current stage. */
function progress(stage: number) {
  const cells = STAGES.map((label, i) => {
    const done = i <= stage;
    return `<td width="20%" valign="top" style="padding:0 2px">
<div style="height:6px;border-radius:3px;background:${done ? ACCENT : LINE}"></div>
<div style="font-size:11px;line-height:1.3;margin-top:6px;color:${i === stage ? INK : MUTED};font-weight:${i === stage ? 700 : 400}">${label}</div></td>`;
  }).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 8px"><tr>${cells}</tr></table>`;
}

function deliveryFacts(order: Order, stage: number) {
  const rows = [
    stage < 4 ? ["Arriving", arrivalDate(order)] : ["Delivered", arrivalDate(order)],
    ["Carrier", `${BRAND.carrier} · ${SHIPPING[order.shippingMethod].label}`],
    ["Tracking", order.trackingNumber],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;background:${PAPER};border-radius:12px;margin:16px 0">
${rows.map(([k, v]) => `<tr><td style="padding:10px 16px;color:${MUTED};width:90px">${k}</td><td style="padding:10px 16px;font-weight:600">${esc(v)}</td></tr>`).join("")}
</table>`;
}

function thumb(src: string | null | undefined, alt: string, size: number) {
  return src
    ? `<img src="${APP_URL}${src}" width="${size}" height="${size}" alt="${esc(alt)}" style="display:block;width:${size}px;height:${size}px;border-radius:10px;object-fit:cover;border:0">`
    : `<div style="width:${size}px;height:${size}px;border-radius:10px;background:${PAPER}"></div>`;
}

function itemsTable(order: Order, items: OrderItem[]) {
  const c = order.currency as Currency;
  const rows = items
    .map(
      (i) => `<tr>
<td width="64" style="padding:10px 12px 10px 0;border-bottom:1px solid ${LINE}">${thumb(i.image, i.name, 56)}</td>
<td style="padding:10px 0;border-bottom:1px solid ${LINE}"><div style="font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em">${esc(i.brand)}</div><div style="font-weight:600">${esc(i.name)}</div><div style="color:${MUTED};font-size:13px">${i.option ? `${esc(i.option)} · ` : ""}Qty ${i.quantity}</div></td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};white-space:nowrap;font-weight:600">${formatMoney(i.unitPrice * i.quantity, c)}</td></tr>`,
    )
    .join("");
  const ship = SHIPPING[order.shippingMethod];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0">${rows}
<tr><td></td><td style="padding:12px 0 2px;color:${MUTED}">Subtotal</td><td align="right" style="padding:12px 0 2px">${formatMoney(order.subtotal, c)}</td></tr>
<tr><td></td><td style="padding:2px 0;color:${MUTED}">${ship.label} shipping</td><td align="right" style="padding:2px 0">${order.shipping ? formatMoney(order.shipping, c) : "Free"}</td></tr>
<tr><td></td><td style="padding:8px 0;font-weight:800;font-size:16px">Total</td><td align="right" style="padding:8px 0;font-weight:800;font-size:16px">${formatMoney(order.total, c)}</td></tr>
<tr><td></td><td colspan="2" style="padding:0;color:${ACCENT};font-size:13px;font-weight:600">Charged to your card: ${formatMoney(0, c)}</td></tr>
</table>`;
}

/** A row of small photos, for the emails that only need to remind people what's coming. */
function itemStrip(items: OrderItem[]) {
  const shown = items.slice(0, 4);
  const more = items.length - shown.length;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0"><tr>
${shown.map((i) => `<td style="padding-right:8px">${thumb(i.image, i.name, 64)}</td>`).join("")}
${more > 0 ? `<td style="color:${MUTED};font-size:13px">+${more} more</td>` : ""}
</tr></table>`;
}

function address(order: Order) {
  return `<p style="margin:16px 0 0;font-size:14px;color:${MUTED}"><strong style="color:${INK}">Shipping to</strong><br>${esc(order.shipName)}<br>${esc(order.shipLine1)}<br>${esc(order.shipCity)} ${esc(order.shipPostal)}</p>`;
}

/** What makes someone come back: the running savings, the budget still to "spend", and products worth a look. */
export type EmailExtras = {
  /** All-time money kept, in the order's currency. */
  keptTotal: number;
  orderCount: number;
  budgetLeft: number;
  /** Products the person hearted, newest first. */
  saved: Product[];
  /** Suggestions from the same categories as this order. */
  picks: Product[];
};

function savedCallout(order: Order, extras: EmailExtras) {
  const c = order.currency as Currency;
  const allTime =
    extras.orderCount > 1
      ? `<div style="font-size:13px;color:${INK};margin-top:8px;padding-top:8px;border-top:1px solid #c5e2d8">That makes <strong>${formatMoney(extras.keptTotal, c)}</strong> kept across ${extras.orderCount} pretend orders.</div>`
      : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${ACCENT_SOFT};border-radius:12px;padding:18px 20px">
<div style="font-size:12px;color:${ACCENT};font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Money kept</div>
<div style="font-size:30px;line-height:1.2;font-weight:800;color:${ACCENT}">${formatMoney(order.total, c)}</div>
<div style="font-size:13px;color:${MUTED}">Still in your account. Your card was never charged.</div>${allTime}
</td></tr></table>`;
}

function productGrid(products: Product[], currency: Currency, campaign: string) {
  const cells = products.map((p) => {
    const price = localPrice(p.priceUsd, currency);
    const sale = p.compareAtUsd && p.compareAtUsd > p.priceUsd;
    return `<td width="33%" valign="top" style="padding:0 6px">
<a href="${track(`/product/${p.slug}`, campaign)}" style="color:${INK};text-decoration:none;display:block">
${p.image ? `<img src="${APP_URL}${p.image}" width="160" alt="${esc(p.name)}" style="display:block;width:100%;max-width:160px;height:auto;border-radius:10px;border:0">` : ""}
<div style="font-size:13px;line-height:1.35;margin-top:8px">${esc(p.name)}</div>
<div style="font-size:15px;font-weight:800;margin-top:4px;color:${sale ? DEAL : INK}">${formatMoney(price, currency)}${sale ? ` <span style="font-size:12px;font-weight:400;color:${MUTED};text-decoration:line-through">${formatMoney(localPrice(p.compareAtUsd!, currency), currency)}</span>` : ""}</div>
</a></td>`;
  });
  // Keep a three-column rhythm even with fewer products.
  while (cells.length < 3) cells.push(`<td width="33%"></td>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells.join("")}</tr></table>`;
}

/** Saved items first ("the urge is back?"), otherwise suggestions, plus the budget still to play with. */
function comeBack(order: Order, extras: EmailExtras, campaign: string) {
  const c = order.currency as Currency;
  const fromSaved = extras.saved.length > 0;
  const products = (fromSaved ? extras.saved : extras.picks).slice(0, 3);
  if (!products.length) return "";
  const budget = extras.budgetLeft > 0
    ? `<p style="margin:0 0 14px;color:${MUTED};font-size:14px">You still have <strong style="color:${INK}">${formatMoney(extras.budgetLeft, c)}</strong> of pretend budget this month.</p>`
    : "";
  return `${sectionTitle(fromSaved ? "Still on your saved list" : "You might also want")}${budget}
${productGrid(products, c, campaign)}
${button(track(fromSaved ? "/saved" : "/shop", campaign), fromSaved ? "See your saved items" : "Keep shopping", INK)}`;
}

function shareBlock(campaign: string) {
  const url = new URL("/", APP_URL);
  url.searchParams.set("utm_source", "share");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  const link = url.toString();
  const pitch = `I've been "shopping" on ${BRAND.name}: full cart, real tracking emails, nothing charged. It kills the urge and keeps the money.`;
  const e = encodeURIComponent;
  // PNG logos under /public/email: Gmail and Outlook don't render SVG.
  const targets = [
    ["WhatsApp", "whatsapp", `https://wa.me/?text=${e(`${pitch} ${link}`)}`],
    ["X", "x", `https://twitter.com/intent/tweet?text=${e(pitch)}&url=${e(link)}`],
    ["Facebook", "facebook", `https://www.facebook.com/sharer/sharer.php?u=${e(link)}`],
    ["Email", "email", `mailto:?subject=${e(`Try ${BRAND.name}`)}&body=${e(`${pitch}\n\n${link}`)}`],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0"><tr><td style="background:${SUN};border-radius:12px;padding:20px">
<div style="font-size:17px;font-weight:800">Know someone with a full cart and an empty wallet?</div>
<div style="font-size:14px;margin:4px 0 14px">Send them ${BRAND.name}. Same thrill, zero damage.</div>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
${targets.map(([label, icon, href]) => `<td style="padding-right:12px"><a href="${href}" title="Share on ${label}" style="text-decoration:none"><img src="${APP_URL}/email/share-${icon}.png" width="40" height="40" alt="${label}" style="display:block;width:40px;height:40px;border:0;font-size:11px;color:${INK}"></a></td>`).join("")}
</tr></table>
</td></tr></table>`;
}

/** Five tappable scores. Each opens a check-in page that needs no sign-in, with that score picked: link scanners open links too, so saving still takes one tap there. */
function urgeQuestion(order: Order, campaign: string) {
  const cells = [1, 2, 3, 4, 5]
    .map((n) => `<td style="padding-right:6px"><a href="${track(`${urgePath(order.id)}?score=${n}`, campaign)}" style="display:inline-block;width:40px;line-height:40px;text-align:center;border:2px solid ${ACCENT};border-radius:12px;color:${ACCENT};font-weight:800;font-size:18px;text-decoration:none">${n}</a></td>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border:1px solid ${LINE};border-radius:12px;padding:20px">
<div style="font-size:18px;font-weight:800">Did this take the edge off the urge?</div>
<div style="font-size:13px;color:${MUTED};margin:2px 0 14px">Tap a number. It takes two seconds and helps us know if this works.</div>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
<div style="font-size:12px;color:${MUTED};margin-top:8px">1 · Not at all&nbsp;&nbsp;&nbsp;&nbsp;5 · Completely</div>
</td></tr></table>`;
}

const firstName = (order: Order) => esc(order.shipName.split(" ")[0]);

function itemsText(order: Order, items: OrderItem[]) {
  const c = order.currency as Currency;
  return items.map((i) => `- ${i.name} (${i.brand})${i.option ? `, ${i.option}` : ""} x${i.quantity}: ${formatMoney(i.unitPrice * i.quantity, c)}`).join("\n");
}

export function loginEmail(link: string, code: string) {
  const text = `Your ${BRAND.name} sign-in code: ${code}\n\nOr sign in with this link: ${link}\n\nBoth expire in 20 minutes. If you didn't request this, ignore this email.`;
  const html = layout({
    preheader: `Your sign-in code is ${code}`,
    campaign: "login",
    notice: "Simulated store · nothing is charged and nothing ships",
    body: `${heading(`Sign in to ${BRAND.name}`)}
<p style="margin:12px 0 0">Enter this code where you left off. It expires in 20 minutes and can be used once.</p>
<p style="margin:20px 0;padding:16px;background:${PAPER};border-radius:12px;text-align:center;font-size:34px;font-weight:800;letter-spacing:0.3em;font-family:ui-monospace,Menlo,Consolas,monospace">${code}</p>
<p style="margin:0;color:${MUTED}">On another device? Sign in with one tap instead:</p>
${button(link, "Sign in")}
<p style="color:${MUTED};font-size:13px;margin:0">If you didn't ask for this, you can ignore this email.</p>`,
    footer: `${BRAND.name} is a simulated store: full shopping, nothing charged, nothing shipped. <a href="${APP_URL}" style="color:${MUTED}">${SITE}</a>`,
  });
  // The code leads the subject so it can be read straight off the notification.
  return { subject: `${code} is your ${BRAND.name} sign-in code`, html, text };
}

export function orderConfirmationEmail(order: Order, items: OrderItem[], extras: EmailExtras) {
  const c = order.currency as Currency;
  const campaign = "order_confirmed";
  // "Pretend" leads every order subject, so an inbox preview never passes for a real purchase.
  const subject = `Pretend order confirmed: #${order.number}`;
  const text = `Thanks for your order #${order.number}. Total: ${formatMoney(order.total, c)} (simulated, not charged).
Arriving ${arrivalDate(order)} with ${BRAND.carrier}.

${itemsText(order, items)}

Track it: ${orderUrl(order, campaign)}`;
  const html = layout({
    preheader: `Arriving ${arrivalDate(order)}. ${formatMoney(order.total, c)} kept, not charged.`,
    campaign,
    body: `${heading(`Thanks, ${firstName(order)}! Your order is confirmed.`, `Order #${order.number} · Payment approved (simulated)`)}
${progress(0)}
${deliveryFacts(order, 0)}
${button(orderUrl(order, campaign), "Track your order")}
${sectionTitle("In your order")}
${itemsTable(order, items)}
${address(order)}
${savedCallout(order, extras)}
${comeBack(order, extras, campaign)}
${shareBlock(campaign)}`,
  });
  return { subject, html, text };
}

const STAGE_COPY = {
  1: {
    subject: (o: Order) => `Your pretend order #${o.number} has shipped`,
    heading: "Your order is on its way",
    body: () => `Your package just left our warehouse with ${BRAND.carrier}. Follow it across the map.`,
    cta: "Track package",
  },
  3: {
    subject: (o: Order) => `Pretend order out for delivery: #${o.number}`,
    heading: "Out for delivery today",
    body: (o: Order) => `Your package is on the van in ${esc(o.shipCity)} and should arrive today.`,
    cta: "Track package",
  },
  4: {
    subject: (o: Order) => `Pretend order delivered: #${o.number}`,
    heading: "Delivered!",
    body: () => `It's at your door. Well, not really. But the money is still in your account, and that's the part that lasts.`,
    cta: "View your order",
  },
} as const;

export function trackingEmail(order: Order, stage: 1 | 3 | 4, items: OrderItem[], extras: EmailExtras) {
  const copy = STAGE_COPY[stage];
  const campaign = `order_stage_${stage}`;
  const subject = copy.subject(order);
  const text = `${copy.heading}. Order #${order.number} (simulated, nothing ships).
${stage < 4 ? `Arriving ${arrivalDate(order)}. ` : ""}Tracking ${order.trackingNumber}.
${stage === 4 ? "\nDid this take the edge off the urge? Answer on the order page: " : "\n"}${orderUrl(order, campaign)}`;
  const delivered = stage === 4;
  const html = layout({
    preheader: delivered ? `${formatMoney(order.total, order.currency as Currency)} kept. One quick question inside.` : `Arriving ${arrivalDate(order)} · ${order.trackingNumber}`,
    campaign,
    body: `${heading(copy.heading, `Order #${order.number}`)}
<p style="margin:14px 0 0">${copy.body(order)}</p>
${progress(stage)}
${delivered ? urgeQuestion(order, campaign) : deliveryFacts(order, stage)}
${itemStrip(items)}
${delivered ? savedCallout(order, extras) : button(orderUrl(order, campaign), copy.cta)}
${comeBack(order, extras, campaign)}
${shareBlock(campaign)}
${delivered ? `<p style="color:${MUTED};font-size:13px;margin:24px 0 0">Got a minute more? <a href="${track("/feedback", campaign)}" style="color:${ACCENT};font-weight:600">Tell us what you think of ${BRAND.name}</a>.</p>` : ""}`,
  });
  return { subject, html, text };
}

const FEEDBACK_KINDS: Record<Feedback["kind"], string> = { idea: "Idea", problem: "Problem", other: "Feedback" };

// Sent to the admins in ADMIN_EMAILS. Reply goes straight to the sender.
export function feedbackNotificationEmail(f: Pick<Feedback, "email" | "kind" | "message">) {
  const label = FEEDBACK_KINDS[f.kind];
  const subject = `${label} from ${f.email}`;
  const text = `${label} from ${f.email}:\n\n${f.message}\n\nAll feedback: ${APP_URL}/insights`;
  const html = layout({
    preheader: `${label}: ${f.message.slice(0, 80)}`,
    campaign: "admin_feedback",
    notice: "Admin notification",
    body: `${heading(`New ${label.toLowerCase()}`)}
<p style="color:${MUTED};margin:0">From <a href="mailto:${esc(f.email)}" style="color:${ACCENT}">${esc(f.email)}</a></p>
<div style="background:${PAPER};border:1px solid ${LINE};border-radius:12px;padding:16px 18px;margin:20px 0;white-space:pre-wrap">${esc(f.message)}</div>
${button(`${APP_URL}/insights#feedback`, "See all feedback")}`,
    footer: `Sent from the feedback form at ${SITE}/feedback. Reply to answer the sender directly.`,
  });
  return { subject, html, text, replyTo: f.email };
}
