import { BRAND, type Currency } from "@/lib/config";
import { communityStats } from "@/lib/savings";
import { PhraseRotator } from "./phrase-rotator";

// A phrase only shows once its number is big enough to impress, so a young site shows nothing rather than looking empty.
const MIN = { shoppers: 25, items: 100, money: 500 }; // money in whole units of the display currency

/** Rotating one-liners about what the community has "spent". Renders nothing until at least one phrase qualifies. */
export async function StatsTicker({ currency, locale, className }: { currency: Currency; locale: string; className?: string }) {
  const stats = await communityStats(currency);
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
  const count = (n: number) => n.toLocaleString(locale);
  // "Over €7,000": round down so the claim stays true.
  const roundedDown = (cents: number) => {
    const step = cents >= 1_000_000 ? 100_000 : 10_000;
    return Math.floor(cents / step) * step;
  };

  const phrases = [
    stats.last30Days >= MIN.money * 100 && `${money(stats.last30Days)} in ${BRAND.name} bags. ${money(0)} on cards.`,
    stats.items >= MIN.items && `${count(stats.items)} things bought. Not a cent spent.`,
    stats.total >= MIN.money * 100 && `Over ${money(roundedDown(stats.total))} checked out so far. ${money(0)} charged.`,
    stats.shoppers >= MIN.shoppers && `${count(stats.shoppers)} shoppers went on a spree. Nobody paid.`,
  ].filter((p): p is string => Boolean(p));

  if (!phrases.length) return null;
  return <PhraseRotator phrases={phrases} className={className} />;
}
