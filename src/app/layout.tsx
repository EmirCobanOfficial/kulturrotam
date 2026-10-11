import type { Metadata } from "next";
import { Geist } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KültürRotam — Osmangazi'yi gez, kazan",
  description:
    "Bursa Osmangazi'de ilgi alanına ve saatine göre kişisel kültür rotası; gezdikçe puan, rozet ve yerel esnafta indirim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          KültürRotam · Osmangazi Hackathon · Takım 13
        </footer>
      </body>
    </html>
  );
}
