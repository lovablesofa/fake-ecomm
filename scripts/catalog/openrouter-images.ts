// GPT Image 1 mini (medium quality) through OpenRouter's Image API.
// Picked after a side-by-side test: as clean as Nano Banana 2 Lite at ~1/4 of the price (~$0.0086 per photo).
import { mapLimit } from "./shared";

const MODEL = "openai/gpt-image-1-mini";
const URL = "https://openrouter.ai/api/v1/images";
const CONCURRENCY = 6;
const MAX_ATTEMPTS = 3;

export type ImageJob = { key: string; prompt: string };
/** Called once per generated image. */
export type SaveImage = (key: string, mimeType: string, bytes: Buffer) => void;

/** Problems a retry can't fix: stop the whole run with a clear message. */
export class SetupError extends Error {}

export async function generateImages(apiKey: string, jobs: ImageJob[], save: SaveImage) {
  const failed: string[] = [];
  let done = 0;
  let cost = 0;
  await mapLimit(jobs, CONCURRENCY, async (j) => {
    try {
      const image = await generateOne(apiKey, j.prompt);
      cost += image.cost;
      save(j.key, image.mimeType, image.bytes);
    } catch (err) {
      if (err instanceof SetupError) throw err;
      failed.push(`${j.key}: ${err instanceof Error ? err.message : String(err)}`);
    }
    done++;
    if (done % 10 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length} ($${cost.toFixed(2)} so far)`);
  });
  return failed;
}

async function generateOne(apiKey: string, prompt: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Window Spree catalog" },
        body: JSON.stringify({
          model: MODEL,
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "medium",
          // JPEG keeps each photo ~150 KB instead of a ~1.3 MB PNG.
          output_format: "jpeg",
          output_compression: 85,
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 401) throw new SetupError("Invalid OPENROUTER_API_KEY (check .env).");
      if (res.status === 402) throw new SetupError("OpenRouter account is out of credit: top up at https://openrouter.ai/settings/credits.");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${body?.error?.message ?? res.statusText}`);
      const image = body?.data?.[0];
      if (!image?.b64_json) throw new Error("no image returned");
      return {
        bytes: Buffer.from(image.b64_json, "base64"),
        mimeType: image.media_type ?? "image/png",
        cost: Number(body.usage?.cost ?? 0),
      };
    } catch (err) {
      if (err instanceof SetupError || attempt >= MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
}
