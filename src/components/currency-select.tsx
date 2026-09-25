"use client";

import { setCurrency } from "@/app/actions";
import { CURRENCIES, type Currency } from "@/lib/config";

export function CurrencySelect({ value }: { value: Currency }) {
  return (
    <form action={setCurrency}>
      <label className="sr-only" htmlFor="currency">Currency</label>
      <select
        id="currency"
        name="currency"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="cursor-pointer rounded-full border border-line bg-transparent px-2 py-1 text-sm"
      >
        {Object.entries(CURRENCIES).map(([code, c]) => (
          <option key={code} value={code}>{c.label}</option>
        ))}
      </select>
    </form>
  );
}
