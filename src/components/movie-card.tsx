import Link from "next/link";
import { Clock, Star, Film, Ticket } from "lucide-react";

export interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    slug: string;
    description: string;
    durationMinutes: number;
    releaseDate: string;
    rating: string;
    posterUrl: string;
    language: string;
    genres?: Array<{ name: string; slug: string }>;
    showtimeCount?: number;
  };
}

export function MovieCard({ movie }: MovieCardProps) {
  const hours = Math.floor(movie.durationMinutes / 60);
  const minutes = movie.durationMinutes % 60;

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10">
      {/* Poster Media */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-bold tracking-wider border border-white/10 uppercase">
            {movie.rating}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/90 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Film className="h-3 w-3" /> IMAX
          </span>
        </div>

        {/* Bottom Poster Info Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
            <Clock className="h-3.5 w-3.5 text-amber-400" /> {hours}h {minutes}m
          </span>
          <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-slate-300">
            {movie.language}
          </span>
        </div>
      </div>

      {/* Details Body */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
            {movie.title}
          </h3>

          {/* Genre Pills */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {movie.genres && movie.genres.length > 0 ? (
              movie.genres.slice(0, 3).map((g) => (
                <span
                  key={g.slug}
                  className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/50"
                >
                  {g.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Cinema Feature</span>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2 border-t border-slate-800/60">
          <Link
            href={`/movies/${movie.slug}`}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 py-2.5 text-xs font-semibold tracking-wide transition-all shadow-sm group/btn"
          >
            <Ticket className="h-3.5 w-3.5 text-amber-400 group-hover/btn:text-slate-950" />
            Book Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
