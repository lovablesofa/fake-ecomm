import { BRAND, countryByCode, type ShippingMethod } from "./config";
import type { Order } from "./db/schema";
import { hashInt } from "./crypto";

export const STAGES = ["Preparing", "Shipped", "In transit", "Out for delivery", "Delivered"] as const;
export type Stage = 0 | 1 | 2 | 3 | 4;
export const DELIVERED: Stage = 4;

// Hours after placing the order, as [min, max]; each order picks a random point in the range.
// "outForDelivery" is counted back from delivery. In transit is halfway between shipped and out for delivery.
const HOURS: Record<ShippingMethod, { ship: [number, number]; deliver: [number, number]; outForDelivery: [number, number] }> = {
  express: { ship: [2, 5], deliver: [20, 26], outForDelivery: [3, 5] }, // about 1 day
  standard: { ship: [12, 26], deliver: [72, 96], outForDelivery: [4, 8] }, // 3-4 days
};

// Production always runs in real time. In development TRACKING_SPEED compresses it (60 = hours become minutes).
function speed() {
  if (process.env.NODE_ENV === "production") return 1;
  const s = Number(process.env.TRACKING_SPEED ?? 1);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

export function scheduleFor(method: ShippingMethod, placedAt: Date) {
  const { ship, deliver, outForDelivery } = HOURS[method];
  const pick = ([min, max]: [number, number]) => min + Math.random() * (max - min);
  const at = (hours: number) => new Date(placedAt.getTime() + (hours * 3_600_000) / speed());
  const deliverH = pick(deliver);
  const shipH = pick(ship);
  const ofdH = Math.max(deliverH - pick(outForDelivery), shipH + 1);
  return { shipsAt: at(shipH), outForDeliveryAt: at(ofdH), deliversAt: at(deliverH) };
}

type Schedule = Pick<Order, "placedAt" | "shipsAt" | "outForDeliveryAt" | "deliversAt">;

export function inTransitAt(order: Schedule) {
  return new Date((order.shipsAt.getTime() + order.outForDeliveryAt.getTime()) / 2);
}

export function currentStage(order: Schedule, now = new Date()): Stage {
  if (now >= order.deliversAt) return 4;
  if (now >= order.outForDeliveryAt) return 3;
  if (now >= inTransitAt(order)) return 2;
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
  const transitAt = inTransitAt(order);

  const events: Omit<TrackingEvent, "done">[] = [
    { at: order.placedAt, title: "Order confirmed. Payment approved (simulated)", location: "Online" },
    { at: new Date(order.placedAt.getTime() + (order.shipsAt.getTime() - order.placedAt.getTime()) / 2), title: "Packed and labelled", location: origin },
    { at: order.shipsAt, title: `Picked up by ${BRAND.carrier}`, location: origin },
    { at: transitAt, title: "In transit: arrived at regional hub", location: hub },
    { at: order.outForDeliveryAt, title: "Out for delivery", location: order.shipCity },
    { at: order.deliversAt, title: "Delivered. Left at front door (in theory)", location: order.shipCity },
  ];
  return events.map((e) => ({ ...e, done: now >= e.at }));
}

export function makeTrackingNumber(country: string, digits: string) {
  return `NX${digits}${country === "GB" ? "GB" : country === "US" ? "US" : "EU"}`;
}
