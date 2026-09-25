// Runs tracking updates in-process on long-lived servers (local dev, a VM, Railway, Fly).
// On serverless hosts, set INTERNAL_SCHEDULER=off and call /api/cron/advance instead.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const setting = process.env.INTERNAL_SCHEDULER ?? (process.env.NODE_ENV === "production" ? "off" : "on");
  if (setting !== "on") return;

  const { advanceOrders } = await import("./lib/orders");
  const tick = () =>
    advanceOrders().catch((e) => console.error("[scheduler] advanceOrders failed:", e));
  setInterval(tick, 30_000).unref();
  console.log("[scheduler] tracking updates every 30s");
}
