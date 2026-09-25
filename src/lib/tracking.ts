import { BRAND, countryByCode, type ShippingMethod } from "./config";
import type { Order } from "./db/schema";
import { hashInt } from "./crypto";

export const STAGES = ["Order placed", "Shipped", "Out for delivery", "Delivered"] as const;
export type Stage = 0 | 1 | 2 | 3;

// Minutes after placing the order. Divided by TRACKING_SPEED (e.g. 60 turns hours into minutes for demos).
const OFFSETS_MIN: Record<ShippingMethod, [number, number, number]> = {
  standard: [5 * 60, 2 * 24 * 60 + 8 * 60, 2 * 24 * 60 + 14 * 60],
  express: [90, 18 * 60, 22 * 60],
};

function speed() {
  const s = Number(process.env.TRACKING_SPEED ?? 1);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

export function scheduleFor(method: ShippingMethod, placedAt: Date) {
  const jitter = () => 0.85 + Math.random() * 0.3;
  const at = (min: number) => new Date(placedAt.getTime() + (min * 60_000 * jitter()) / speed());
  const [ship, ofd, deliver] = OFFSETS_MIN[method].map(at);
  // Jitter can reorder stages; keep them monotonic.
  const shipsAt = ship;
  const outForDeliveryAt = new Date(Math.max(ofd.getTime(), shipsAt.getTime() + 1000));
  const deliversAt = new Date(Math.max(deliver.getTime(), outForDeliveryAt.getTime() + 1000));
  return { shipsAt, outForDeliveryAt, deliversAt };
}

type Schedule = Pick<Order, "placedAt" | "shipsAt" | "outForDeliveryAt" | "deliversAt">;

export function currentStage(order: Schedule, now = new Date()): Stage {
  if (now >= order.deliversAt) return 3;
  if (now >= order.outForDeliveryAt) return 2;
  if (now >= order.shipsAt) return 1;
  return 0;
}

const HUBS = {
  US: { origin: "Reno, NV", hubs: ["Salt Lake City, UT", "Denver, CO", "Memphis, TN", "Columbus, OH", "Allentown, PA"] },
  GB: { origin: "Milton Keynes", hubs: ["Birmingham", "Manchester", "Leeds", "Bristol"] },
  EU: { origin: "Venlo, NL", hubs: ["Cologne, DE", "Lyon, FR", "Milan, IT", "Zaragoza, ES", "Liège, BE"] },
};

export type TrackingEvent = { at: Date; title: string; location: string; done: boolean };

export function trackingEvents(order: Order, now = new Date()): TrackingEvent[] {
  const region = countryByCode(order.shipCountry)?.region ?? "US";
  const { origin, hubs } = HUBS[region];
  const hub = hubs[hashInt(order.id) % hubs.length];
  const transitAt = new Date((order.shipsAt.getTime() + order.outForDeliveryAt.getTime()) / 2);

  const events: Omit<TrackingEvent, "done">[] = [
    { at: order.placedAt, title: "Order confirmed. Payment approved (simulated)", location: "Online" },
    { at: new Date(order.placedAt.getTime() + (order.shipsAt.getTime() - order.placedAt.getTime()) / 2), title: "Packed and labelled", location: origin },
    { at: order.shipsAt, title: `Picked up by ${BRAND.carrier}`, location: origin },
    { at: transitAt, title: "Arrived at regional hub", location: hub },
    { at: order.outForDeliveryAt, title: "Out for delivery", location: order.shipCity },
    { at: order.deliversAt, title: "Delivered. Left at front door (in theory)", location: order.shipCity },
  ];
  return events.map((e) => ({ ...e, done: now >= e.at }));
}

export function makeTrackingNumber(country: string, digits: string) {
  return `NX${digits}${country === "GB" ? "GB" : country === "US" ? "US" : "EU"}`;
}
