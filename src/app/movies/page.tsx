"use client";

import { useEffect, useState, useTransition } from "react";
import { FiltersBar } from "@/components/filters-bar";
import { MovieCard } from "@/components/movie-card";
import { Film, AlertCircle } from "lucide-react";

import { MOCK_MOVIES, MOCK_GENRES, MOCK_CINEMAS } from "@/lib/mock-data";

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedCinema, setSelectedCinema] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");

  // Load genres and cinemas once
  useEffect(() => {
    async function loadMeta() {
      try {
        const [gRes, cRes] = await Promise.all([
          fetch("/api/genres").then((r) => r.json()).catch(() => null),
          fetch("/api/cinemas").then((r) => r.json()).catch(() => null),
        ]);
        if (gRes?.success) setGenres(gRes.data.genres);
        else setGenres(MOCK_GENRES);

        if (cRes?.success) setCinemas(cRes.data.cinemas);
        else setCinemas(MOCK_CINEMAS);
      } catch (_err) {
        setGenres(MOCK_GENRES);
        setCinemas(MOCK_CINEMAS);
      }
    }
    loadMeta();
  }, []);

  // Fetch movies whenever filters change
  useEffect(() => {
    let isCancelled = false;
    async function fetchMovies() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (selectedGenre !== "all") params.set("genre", selectedGenre);
        if (selectedLanguage !== "all") params.set("language", selectedLanguage);
        if (selectedCinema !== "all") params.set("cinema", selectedCinema);
        if (selectedDate !== "all") params.set("date", selectedDate);

        const res = await fetch(`/api/movies?${params.toString()}`).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          if (!isCancelled && json.success) {
            setMovies(json.data.movies);
            return;
          }
        }
      } catch (_err) {}

      // Fallback filtering on MOCK_MOVIES
      if (!isCancelled) {
        let list = [...MOCK_MOVIES];
        if (search) {
          list = list.filter((m) =>
            m.title.toLowerCase().includes(search.toLowerCase())
          );
        }
        if (selectedGenre !== "all") {
          list = list.filter((m) =>
            m.genres.some((g) => g.slug === selectedGenre)
          );
        }
        if (selectedLanguage !== "all") {
          list = list.filter((m) => m.language === selectedLanguage);
        }
        setMovies(list);
        setLoading(false);
      }
    }

    const timeout = setTimeout(fetchMovies, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [search, selectedGenre, selectedLanguage, selectedCinema, selectedDate]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
          Explore Cinema Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
          Movies & Showtimes
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Filter through blockbuster premieres, IMAX exclusives, and indie screenings across our
          theatres.
        </p>
      </div>

      {/* Filter Bar */}
      <FiltersBar
        search={search}
        onSearchChange={setSearch}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedCinema={selectedCinema}
        onCinemaChange={setSelectedCinema}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        genres={genres}
        cinemas={cinemas}
      />

      {/* Movie Results */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-2xl bg-slate-900 animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <Film className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Movies Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn't find any screenings matching your selected filters. Try broadening your
              search or clearing selected filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedGenre("all");
                setSelectedLanguage("all");
                setSelectedCinema("all");
                setSelectedDate("all");
              }}
              className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-amber-400 border border-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
