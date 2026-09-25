import type { MetadataRoute } from "next";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { APP_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: APP_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/shop`, changeFrequency: "weekly", priority: 0.8 },
    ...CATEGORIES.map((c) => ({ url: `${APP_URL}/shop?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...PRODUCTS.map((p) => ({
      url: `${APP_URL}/product/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      ...(p.image && { images: [`${APP_URL}${p.image}`] }),
    })),
  ];
}
