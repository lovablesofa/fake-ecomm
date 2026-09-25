export function Stars({ rating, reviews }: { rating: number; reviews?: number }) {
  const pct = (rating / 5) * 100;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <span className="relative inline-block leading-none tracking-tight" aria-label={`${rating} out of 5 stars`}>
        <span className="text-stone-300">★★★★★</span>
        <span className="absolute inset-0 overflow-hidden text-amber-500" style={{ width: `${pct}%` }}>
          ★★★★★
        </span>
      </span>
      <span>
        {rating.toFixed(1)}
        {reviews !== undefined && ` (${reviews.toLocaleString("en-US")})`}
      </span>
    </span>
  );
}
