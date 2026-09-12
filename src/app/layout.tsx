import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBook - Premium Cinema Ticket Booking Simulator",
  description:
    "Educational portfolio cinema ticket booking demonstration. Select seats, view showtimes, and generate test digital passes.",
  keywords: ["cinema simulator", "movie tickets demo", "portfolio project", "CineBook"],
  authors: [{ name: "CineBook Project" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-[11px] font-medium text-amber-300">
          🛡️ <strong>Portfolio Demonstration</strong>: CineBook is an educational cinema simulation platform. No real payments, cards, or sensitive data are collected.
        </div>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
