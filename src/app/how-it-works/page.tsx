import type { Metadata } from "next";
import Link from "next/link";
import { monthlyBudget } from "@/lib/budget";
import { getCurrency } from "@/lib/cart";
import { BRAND } from "@/lib/config";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "How it works" };

// 24px line icons, drawn in the current text colour.
const icon = (path: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-7" aria-hidden>
    {path}
  </svg>
);

const STEPS = [
  { title: "Shop", body: "Browse and fill your bag.", icon: icon(<><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>) },
  { title: "Check out", body: "Pay with Pretend Pay. No card needed.", icon: icon(<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></>) },
  { title: "Track", body: "Follow your package to your door.", icon: icon(<><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2" /></>) },
  { title: "Unbox", body: "It lands in your orders. Your money stays put.", icon: icon(<><path d="M3 8l9-4 9 4v9l-9 4-9-4z" /><path d="M3 8l9 4 9-4M12 12v9" /></>) },
];

const ADVICE = [
  { country: "US", name: "NFCC", href: "https://www.nfcc.org/" },
  { country: "UK", name: "StepChange", href: "https://www.stepchange.org/" },
  { country: "Ireland", name: "MABS", href: "https://www.mabs.ie/" },
];

export default async function HowItWorks() {
  const currency = await getCurrency();
  const budget = formatMoney(monthlyBudget(currency), currency).replace(/\.00$/, "");

  const faq: [string, React.ReactNode][] = [
    [
      "So what's the point?",
      <>
        A lot of impulse shopping isn&apos;t about the thing. It&apos;s about the moment of buying: picking it, checking
        out, the confirmation email, waiting for the box. {BRAND.name} gives you all of that, and your money stays
        exactly where it is. After delivery, we ask if you still want it. If you do, great, now you know it&apos;s not
        just an impulse.
      </>,
    ],
    ["Will I be charged?", "No. There's no real payment step, we never ask for card details, and no bank is ever contacted. The checkout is a simulation from start to finish."],
    ["Will anything arrive?", `No. The tracking updates follow a realistic timeline, but no package exists. ${BRAND.carrier} isn't a real carrier.`],
    ["Are these real products?", "No. Every brand and product here is made up. We want you to feel the urge to buy, not send you off to buy the real thing."],
    ["Is it free?", `Yes. Every account gets ${budget} of pretend money to spend each month, and it costs nothing.`],
    ["What if I still want the real thing?", `Then buy it, guilt-free. ${BRAND.name} isn't about never buying. It's about buying on purpose.`],
    [
      "Is this a treatment for shopping addiction?",
      <>
        No. It&apos;s a playful way to ride out the urge. If shopping is causing you real stress or debt, talking to a
        professional can help. Free, confidential debt advice:{" "}
        {ADVICE.map((a, i) => (
          <span key={a.name}>
            {i > 0 && ", "}
            <a href={a.href} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">{a.name}</a> ({a.country})
          </span>
        ))}
        .
      </>,
    ],
    ["What do you do with my email and address?", "We use your email for sign-in, order confirmations and tracking updates. The address only makes the tracking feel real, and a rough one is fine. You can delete your account and all your data at any time from your account page."],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="font-display text-5xl sm:text-6xl">The urge is real. The purchase isn&apos;t.</h1>
      <p className="mt-6 text-lg text-muted">
        {BRAND.name} is a complete online store where nothing costs anything. The only thing missing is the bill.
      </p>
      <ol className="mt-10 grid gap-4 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="card flex gap-4 p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">{s.icon}</span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted">Step {i + 1}</p>
              <h2 className="font-display text-2xl">{s.title}</h2>
              <p className="mt-1 text-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <h2 className="mt-16 font-display text-3xl">Questions</h2>
      <dl className="mt-4 divide-y divide-line border-y border-line">
        {faq.map(([q, a]) => (
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
