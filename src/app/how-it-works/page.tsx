import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: "How it works" };

const FAQ = [
  ["Will I be charged?", "No. There's no real payment step, we never ask for card details, and no bank is ever contacted. The checkout is a simulation from start to finish."],
  ["Will anything arrive?", `No. The tracking updates follow a realistic timeline, but no package exists. ${BRAND.carrier} isn't a real carrier.`],
  ["Are these real products?", "No. Every brand and product here is made up. We want you to feel the urge to buy, not send you off to buy the real thing."],
  ["So what's the point?", "Much impulse shopping is about the moment of buying: picking, checking out, the confirmation email, waiting for the package. You get all of that here, and the money stays in your account. After delivery we ask if you still want the item. Most of the time the answer is no."],
  ["What do you do with my email and address?", "We use your email for sign-in, order confirmations and tracking updates. The address only makes the tracking feel real, and a rough one is fine. You can delete your account and all your data at any time from your account page."],
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="font-display text-5xl sm:text-6xl">The urge is real. The purchase isn&apos;t.</h1>
      <p className="mt-6 text-lg text-muted">
        {BRAND.name} is a complete online store where nothing costs anything. Browse, fill your bag, check out, get your
        confirmation email, and follow the package to your door. The only thing missing is the bill.
      </p>
      <dl className="mt-12 divide-y divide-line border-y border-line">
        {FAQ.map(([q, a]) => (
          <div key={q} className="py-6">
            <dt className="font-display text-2xl">{q}</dt>
            <dd className="mt-2 text-muted">{a}</dd>
          </div>
        ))}
      </dl>
      <Link href="/shop" className="btn-primary mt-10">Start shopping</Link>
    </div>
  );
}
