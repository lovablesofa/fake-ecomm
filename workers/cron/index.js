// Cloudflare Worker that wakes the site every 5 minutes so tracking emails go out on time.
// Vercel's free plan only runs its own cron once a day. Deploy with `npx wrangler deploy` from this folder.
const worker = {
  async scheduled(_controller, env) {
    const res = await fetch(`${env.APP_URL}/api/cron/advance`, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const body = await res.text();
    // Throwing marks the run as failed in the Cloudflare dashboard.
    if (!res.ok) throw new Error(`advance failed: ${res.status} ${body.slice(0, 200)}`);
    console.log(`advance ok: ${body}`);
  },
};

export default worker;
