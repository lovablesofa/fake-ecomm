import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Ideas, problems, things you loved or hated. Tell us what you think of the store.",
  robots: { index: false },
};

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
      <h1 className="font-display text-5xl">Tell us what you think</h1>
      <p className="mt-3 text-lg text-muted">
        Ideas, problems, things you loved or hated. We read every message, and it shapes what we build next.
      </p>
      <FeedbackForm email={user?.email ?? ""} />
    </div>
  );
}
