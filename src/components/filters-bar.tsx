"use client";

import { Search, Calendar, MapPin, Globe, Film, X } from "lucide-react";

export interface FiltersBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedGenre: string;
  onGenreChange: (val: string) => void;
  selectedLanguage: string;
  onLanguageChange: (val: string) => void;
  selectedCinema: string;
  onCinemaChange: (val: string) => void;
  selectedDate: string;
  onDateChange: (val: string) => void;
  genres: Array<{ name: string; slug: string }>;
  cinemas: Array<{ id: string; name: string }>;
}

export function FiltersBar({
  search,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedLanguage,
  onLanguageChange,
  selectedCinema,
  onCinemaChange,
  selectedDate,
  onDateChange,
  genres,
  cinemas,
}: FiltersBarProps) {
  // Generate date options: Today, Tomorrow, +2 days, +3 days
  const today = new Date();
  const dateOptions = [
    { label: "All Dates", value: "all" },
    ...Array.from({ length: 4 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      let label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      if (i === 0) label = "Today";
      if (i === 1) label = "Tomorrow";
      return { label, value: iso };
    }),
  ];

  const clearAllFilters = () => {
    onSearchChange("");
    onGenreChange("all");
    onLanguageChange("all");
    onCinemaChange("all");
    onDateChange("all");
  };

  const hasActiveFilters =
    search ||
    selectedGenre !== "all" ||
    selectedLanguage !== "all" ||
    selectedCinema !== "all" ||
    selectedDate !== "all";

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg border border-slate-800/80">
      {/* Search Input and Primary Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search movies or keywords..."
            className="w-full rounded-xl bg-slate-900/90 pl-10 pr-8 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Cinema Selector */}
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedCinema}
            onChange={(e) => onCinemaChange(e.target.value)}
            className="w-full appearance-none rounded-xl bg-slate-900/90 pl-10 pr-8 py-2.5 text-sm text-slate-100 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors cursor-pointer"
          >
            <option value="all">All Cinema Locations</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full appearance-none rounded-xl bg-slate-900/90 pl-10 pr-8 py-2.5 text-sm text-slate-100 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
          </select>
        </div>

        {/* Date Selector Dropdown (Mobile fallback) */}
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full appearance-none rounded-xl bg-slate-900/90 pl-10 pr-8 py-2.5 text-sm text-slate-100 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors cursor-pointer"
          >
            {dateOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Genre Filter Pills & Date Fast-Select */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
        {/* Genre Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => onGenreChange("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedGenre === "all"
                ? "bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/20"
                : "bg-slate-850 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            All Genres
          </button>
          {genres.map((g) => (
            <button
              key={g.slug}
              onClick={() => onGenreChange(g.slug)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedGenre === g.slug
                  ? "bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/20"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Clear filters if active */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-amber-400/90 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" /> Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
