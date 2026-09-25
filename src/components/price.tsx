import type { Currency } from "@/lib/config";
import { formatMoney, localPrice } from "@/lib/money";

export function Price({ usd, compareAtUsd, currency, className = "" }: { usd: number; compareAtUsd?: number; currency: Currency; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-semibold">{formatMoney(localPrice(usd, currency), currency)}</span>
      {compareAtUsd && (
        <span className="text-sm text-muted line-through">{formatMoney(localPrice(compareAtUsd, currency), currency)}</span>
      )}
    </span>
  );
}
