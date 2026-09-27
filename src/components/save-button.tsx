"use client";

import { usePathname } from "next/navigation";
import { useOptimistic } from "react";
import { setSaved } from "@/app/actions";

/** Heart toggle. `saved` is null when signed out: pressing it goes to sign in, then back to this page. */
export function SaveButton({ slug, name, saved, className = "" }: { slug: string; name: string; saved: boolean | null; className?: string }) {
  const pathname = usePathname();
  const [optimistic, setOptimistic] = useOptimistic(!!saved);
  const label = optimistic ? `Remove ${name} from saved` : `Save ${name} for later`;
  return (
    <form
      action={async (formData) => {
        if (saved !== null) setOptimistic(!optimistic);
        await setSaved(formData);
      }}
      onSubmit={(e) => {
        // Keep filters like ?category= when coming back after sign-in.
        e.currentTarget.next.value = location.pathname + location.search;
      }}
      className={className}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="saved" value={optimistic ? "0" : "1"} />
      <input type="hidden" name="next" defaultValue={pathname} />
      <button
        type="submit"
        aria-label={label}
        aria-pressed={optimistic}
        title={saved === null ? "Sign in to save this for later" : label}
        className="grid size-9 place-items-center rounded-full bg-white/95 text-ink shadow-sm ring-1 ring-line transition hover:scale-105 hover:text-deal focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg viewBox="0 0 24 24" className={`size-5 ${optimistic ? "fill-deal text-deal" : "fill-none"}`} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.5 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
        </svg>
      </button>
    </form>
  );
}
