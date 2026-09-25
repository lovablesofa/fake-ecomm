import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-5xl">Not found</h1>
      <p className="mt-4 text-muted">This page is as real as our shipping.</p>
      <Link href="/shop" className="btn-primary mt-8">Back to the shop</Link>
    </div>
  );
}
