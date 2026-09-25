import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/config";

// Account, checkout and admin pages are per-user and have nothing worth indexing.
const PRIVATE = ["/account", "/api/", "/auth/", "/cart", "/checkout", "/dev/", "/insights", "/login", "/orders"];

// Named explicitly so the welcome to AI crawlers stays deliberate even if the default rule changes.
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
