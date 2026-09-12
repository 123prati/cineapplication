import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineBook - Premium Cinema Ticket Booking",
  description:
    "Reserve luxury cinema tickets, choose interactive seats in real time, and get instant digital passes for IMAX, Dolby Cinema, and VIP Lounges.",
  keywords: ["cinema", "movie tickets", "IMAX", "Dolby Atmos", "CineBook", "seat booking"],
  authors: [{ name: "CineBook Team" }],
  openGraph: {
    title: "CineBook - Luxury Cinema Ticket Booking",
    description: "Real-time seat reservations, IMAX showtimes, and digital tickets.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
