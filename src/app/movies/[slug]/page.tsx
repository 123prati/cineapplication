import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Calendar, Film, Play, Star, MapPin, Ticket, ShieldCheck } from "lucide-react";
import { getDb } from "@/db";
import {
  movies,
  movieGenres,
  genres,
  showtimes,
  auditoriums,
  cinemas,
} from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { formatCents } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();

  // 1. Fetch movie
  const [movie] = await db
    .select()
    .from(movies)
    .where(eq(movies.slug, slug));

  if (!movie) {
    notFound();
  }

  // 2. Fetch genres
  const movieGenreRows = await db
    .select({
      name: genres.name,
      slug: genres.slug,
    })
    .from(movieGenres)
    .innerJoin(genres, eq(movieGenres.genreId, genres.id))
    .where(eq(movieGenres.movieId, movie.id));

  // 3. Fetch upcoming showtimes grouped by cinema
  const now = new Date();
  const showtimeRows = await db
    .select({
      id: showtimes.id,
      startTime: showtimes.startTime,
      endTime: showtimes.endTime,
      basePriceCents: showtimes.basePriceCents,
      auditoriumId: auditoriums.id,
      auditoriumName: auditoriums.name,
      screenType: auditoriums.screenType,
      cinemaId: cinemas.id,
      cinemaName: cinemas.name,
      cinemaAddress: cinemas.address,
      cinemaCity: cinemas.city,
    })
    .from(showtimes)
    .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
    .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
    .where(and(eq(showtimes.movieId, movie.id), gte(showtimes.startTime, now)));

  // Group by cinema
  const cinemaMap: Record<string, any> = {};
  for (const st of showtimeRows) {
    if (!cinemaMap[st.cinemaId]) {
      cinemaMap[st.cinemaId] = {
        id: st.cinemaId,
        name: st.cinemaName,
        address: st.cinemaAddress,
        city: st.cinemaCity,
        showtimes: [],
      };
    }
    cinemaMap[st.cinemaId].showtimes.push(st);
  }

  const cinemaList = Object.values(cinemaMap);

  const hours = Math.floor(movie.durationMinutes / 60);
  const minutes = movie.durationMinutes % 60;

  return (
    <div className="space-y-12 pb-16">
      {/* Backdrop Header */}
      <section className="relative w-full min-h-[420px] sm:min-h-[500px] flex items-end overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-60 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/70 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col md:flex-row items-start md:items-end gap-6 sm:gap-8">
          {/* Floating Poster */}
          <div className="w-36 sm:w-52 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-slate-700/80 bg-slate-900 hidden sm:block">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details in Header */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-xs font-black uppercase">
                {movie.rating}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 text-slate-300 text-xs font-medium border border-slate-700">
                {hours}h {minutes}m
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 text-slate-300 text-xs font-medium border border-slate-700">
                {movie.language}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 text-slate-300 text-xs font-medium border border-slate-700">
                Released {movie.releaseDate}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {movie.title}
            </h1>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 pt-1">
              {movieGenreRows.map((g: any) => (
                <span
                  key={g.slug}
                  className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Synopsis & Showtimes */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Showtimes Schedule */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              Reserve Seats
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Available Showtimes</h2>
            <p className="text-xs text-slate-400">
              Select a showtime to view real-time seat availability and book tickets.
            </p>
          </div>

          {cinemaList.length > 0 ? (
            <div className="space-y-6">
              {cinemaList.map((cinema: any) => (
                <div
                  key={cinema.id}
                  className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-800"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-400" />
                        {cinema.name}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {cinema.address}, {cinema.city}
                      </span>
                    </div>
                  </div>

                  {/* Showtimes Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {cinema.showtimes.map((st: any) => {
                      const stDate = new Date(st.startTime);
                      const timeStr = stDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                      const dayStr = stDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <Link
                          key={st.id}
                          href={`/showtimes/${st.id}`}
                          className="group p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-2 hover:shadow-md hover:shadow-amber-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-400">
                              {dayStr}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase">
                              {st.screenType}
                            </span>
                          </div>
                          <div>
                            <span className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                              {timeStr}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {st.auditoriumName}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-mono">
                              From {formatCents(st.basePriceCents)}
                            </span>
                            <span className="font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Select <Ticket className="h-3 w-3" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400 text-sm">
              No upcoming showtimes currently scheduled for this movie. Check back soon!
            </div>
          )}
        </div>

        {/* Right Col: Synopsis & Details */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800">
            <h3 className="text-base font-bold text-white">Storyline</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{movie.description}</p>

            {movie.trailerUrl && (
              <div className="pt-2">
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-amber-400 border border-slate-700 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-amber-400" /> Watch Trailer on YouTube
                </a>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3 text-xs text-slate-400 border border-slate-800">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              100% Guaranteed Reserved Seating
            </div>
            <p>
              Your seats are temporarily locked for 10 minutes upon selection with atomic database
              transactions to ensure zero double-booking collisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
