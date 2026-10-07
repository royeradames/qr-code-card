import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-outfit" });
export const metadata: Metadata = {
  title: "QR Code Card | Royer Adames",
  description: "A responsive QR code card linking to Frontend Mentor, with an accessible text alternative.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={outfit.variable}>{children}</body></html>;
}
