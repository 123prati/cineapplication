import Link from "next/link";
import { Film, ShieldCheck, Zap, Database } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
                <Film className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Cine<span className="text-amber-400">Book</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Next-generation cinema ticketing platform powered by Neon Serverless PostgreSQL,
              Drizzle ORM, and Next.js App Router. Built with ACID transactions, atomic seat holds,
              and instant digital QR tickets.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Vercel Serverless
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-cyan-400" /> Neon PostgreSQL
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Secure Payment Guard
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Screening Formats
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>IMAX with Laser</li>
              <li>Dolby Cinema Atmos</li>
              <li>VIP Recliner Lounges</li>
              <li>RealD 3D Surround</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/movies" className="hover:text-amber-400 transition-colors">
                  All Movies
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-amber-400 transition-colors">
                  Cinema Locations
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-amber-400 transition-colors">
                  Ticket Retrieval
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition-colors">
                  Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">
            Designed for high concurrency, zero double-bookings, and sub-second seat reservation.
          </p>
        </div>
      </div>
    </footer>
  );
}
