import Link from "next/link";
import { Film, Play, Sparkles, Shield, Compass, Calendar, ArrowRight } from "lucide-react";
import { getDb } from "@/db";
import { movies, genres, movieGenres } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MovieCard } from "@/components/movie-card";

import { MOCK_MOVIES } from "@/lib/mock-data";

export default async function HomePage() {
  let moviesWithGenres: any[] = [];

  try {
    const db = getDb();

    // Fetch active movies
    const allMovies = await db
      .select()
      .from(movies)
      .where(eq(movies.isActive, true));

    // Fetch genres
    const allGenres = await db.select().from(genres);
    const allMovieGenres = await db
      .select({
        movieId: movieGenres.movieId,
        genreName: genres.name,
        genreSlug: genres.slug,
      })
      .from(movieGenres)
      .innerJoin(genres, eq(movieGenres.genreId, genres.id));

    const genresByMovieId: Record<string, Array<{ name: string; slug: string }>> = {};
    for (const mg of allMovieGenres) {
      if (!genresByMovieId[mg.movieId]) genresByMovieId[mg.movieId] = [];
      genresByMovieId[mg.movieId].push({ name: mg.genreName, slug: mg.genreSlug });
    }

    moviesWithGenres = allMovies.map((m: any) => ({
      ...m,
      genres: genresByMovieId[m.id] || [],
    }));
  } catch (_err) {
    // Fallback for static GitHub Pages export
  }

  if (moviesWithGenres.length === 0) {
    moviesWithGenres = MOCK_MOVIES;
  }

  // Featured billboard movie (e.g. Dune: Part Two or first movie)
  const featured =
    moviesWithGenres.find((m: any) => m.slug.includes("dune")) || moviesWithGenres[0];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Billboard */}
      {featured && (
        <section className="relative w-full min-h-[580px] sm:min-h-[640px] flex items-end overflow-hidden border-b border-slate-800/80">
          {/* Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={featured.backdropUrl}
              alt={featured.title}
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-110"
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/70 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/50 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 pt-28 w-full">
            <div className="max-w-2xl space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/30">
                  Featured Premiere
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-bold uppercase tracking-wider border border-white/10">
                  {featured.rating}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 text-cyan-300 text-xs font-semibold border border-cyan-700/50">
                  IMAX 70mm & Dolby Atmos
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
                {featured.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
                {featured.description}
              </p>

              {/* CTA Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={`/movies/${featured.slug}`}
                  className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
                >
                  <Film className="h-4 w-4" />
                  Select Showtimes & Seats
                </Link>

                {featured.trailerUrl && (
                  <a
                    href={featured.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all border border-slate-700/80 flex items-center gap-2 backdrop-blur-md"
                  >
                    <Play className="h-4 w-4 text-amber-400 fill-amber-400" />
                    Watch Official Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Screening Technology Showcase */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-2 border border-slate-800 hover:border-amber-500/30 transition-all">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm">
              IMAX
            </div>
            <h3 className="text-base font-bold text-white">IMAX with Dual Laser</h3>
            <p className="text-xs text-slate-400">
              Unrivaled sharp resolution, crystal-clear projection, and immersive stadium seating.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-2 border border-slate-800 hover:border-amber-500/30 transition-all">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
              DOLBY
            </div>
            <h3 className="text-base font-bold text-white">Dolby Cinema Atmos</h3>
            <p className="text-xs text-slate-400">
              Dimensional spatial audio with multi-layer sound moving completely around you.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-2 border border-slate-800 hover:border-amber-500/30 transition-all">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm">
              VIP
            </div>
            <h3 className="text-base font-bold text-white">Luxury Recliner Lounges</h3>
            <p className="text-xs text-slate-400">
              Full-grain heated leather recliners, at-seat dining service, and private bar entry.
            </p>
          </div>
        </section>

        {/* Now Showing Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
                Now Showing
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                In Theatres Today
              </h2>
            </div>
            <Link
              href="/movies"
              className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              Browse Full Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {moviesWithGenres.map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Explore Cinemas Section */}
        <section className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              World-Class Venues
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Grand Horizon & Starlight IMAX
            </h2>
            <p className="text-sm text-slate-300">
              Discover flagship cinemas equipped with high-contrast 4K laser projectors, luxury
              motorized recliners, and private acoustic auditoriums.
            </p>
            <div className="pt-2">
              <Link
                href="/cinemas"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
              >
                <Compass className="h-4 w-4 text-amber-400" /> View Cinema Locations & Screens
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
