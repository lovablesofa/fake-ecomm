import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { BRAND } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-display-serif", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name}: ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: "The full online shopping experience, from bag to doorstep, with nothing charged and nothing shipped.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
