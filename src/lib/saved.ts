import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { getCurrentUser } from "./auth";
import { getProduct, type Product } from "./catalog";
import { db, schema } from "./db";

/** Slugs the signed-in person has saved, or null when signed out. Cached per request, so every card can ask. */
export const getSavedSlugs = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const rows = await db
    .select({ slug: schema.savedItems.productSlug })
    .from(schema.savedItems)
    .where(eq(schema.savedItems.userId, user.id))
    .orderBy(desc(schema.savedItems.createdAt));
  return new Set(rows.map((r) => r.slug));
});

/** Saved products, newest first. Slugs that left the catalog just drop out. */
export async function getSavedProducts() {
  const slugs = await getSavedSlugs();
  return [...(slugs ?? [])].map(getProduct).filter((p): p is Product => !!p);
}
