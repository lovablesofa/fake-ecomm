import type { Currency } from "@/lib/config";
import { formatMoney, localPrice } from "@/lib/money";

/** Whole-percent markdown, or 0 when the product isn't on sale. */
export function discountPct(usd: number, compareAtUsd?: number) {
  return compareAtUsd && compareAtUsd > usd ? Math.round((1 - usd / compareAtUsd) * 100) : 0;
}

export function Price({ usd, compareAtUsd, currency, className = "" }: { usd: number; compareAtUsd?: number; currency: Currency; className?: string }) {
  const onSale = discountPct(usd, compareAtUsd) > 0;
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className={`font-bold ${onSale ? "text-deal" : ""}`}>{formatMoney(localPrice(usd, currency), currency)}</span>
      {onSale && (
        <span className="text-[0.8em] text-muted line-through">{formatMoney(localPrice(compareAtUsd!, currency), currency)}</span>
      )}
    </span>
  );
}
