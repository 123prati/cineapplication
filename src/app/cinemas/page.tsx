import Link from "next/link";
import { MapPin, Phone, Film, Sparkles, Navigation, ArrowRight } from "lucide-react";
import { getDb } from "@/db";
import { cinemas, auditoriums } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CinemasPage() {
  const db = getDb();
  const allCinemas = await db.select().from(cinemas);
  const allAuditoriums = await db.select().from(auditoriums);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
          Cinema Locations
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
          Our Premium Theatres
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Experience state-of-the-art laser projection, spatial acoustic architecture, and
          luxury seating across all destinations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {allCinemas.map((cinema: any) => {
          const cinemaAuditoriums = allAuditoriums.filter((a: any) => a.cinemaId === cinema.id);

          return (
            <div
              key={cinema.id}
              className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-white">{cinema.name}</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold font-mono">
                    Active
                  </span>
                </div>

                {cinema.phone && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" /> Concierge: {cinema.phone}
                  </p>
                )}

                {/* Auditoriums & Screen Formats */}
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Screens & Auditoriums ({cinemaAuditoriums.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cinemaAuditoriums.map((aud: any) => (
                      <div
                        key={aud.id}
                        className="rounded-xl bg-slate-900/90 p-3 border border-slate-800/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{aud.name}</span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            {aud.screenType}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {aud.totalSeats} Luxury Seats
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800/80">
                <Link
                  href={`/movies?cinema=${cinema.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all"
                >
                  <Film className="h-4 w-4 text-amber-400" />
                  View Screenings at this Cinema <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
