import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every distinct width counts as a Vercel image transformation, so keep the
    // list short. Product photos are 1024px squares; nothing needs to be bigger.
    // 64/128/256 cover the cart/checkout/order thumbnails at 1x–2x,
    // 640 covers grid cards and 1080 the product page hero.
    imageSizes: [64, 128, 256],
    deviceSizes: [640, 1080],
    // Keep transformed images cached for 31 days (default is 4 hours) so the
    // same image isn't transformed again. Give a replaced photo a new filename
    // so the cache doesn't keep serving the old one.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
