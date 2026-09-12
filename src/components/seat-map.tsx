"use client";

import { useState } from "react";
import { Check, X, ShieldAlert, Accessibility, Sparkles, Armchair } from "lucide-react";
import { SEAT_STATUS, SEAT_TYPE, formatCents } from "@/lib/constants";

export interface SeatItem {
  id: string; // seatId
  showtimeSeatId: string;
  row: string;
  number: number;
  label: string;
  type: string;
  status: string;
  priceCents: number;
  isHeld: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isAvailable: boolean;
}

export interface SeatMapProps {
  rows: Array<{
    row: string;
    seats: SeatItem[];
  }>;
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatItem) => void;
  screenType?: string;
  maxSeats?: number;
}

export function SeatMap({
  rows,
  selectedSeatIds,
  onToggleSeat,
  screenType = "IMAX",
  maxSeats = 10,
}: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<SeatItem | null>(null);

  const isSelected = (seatId: string) => selectedSeatIds.includes(seatId);

  return (
    <div className="w-full space-y-8 flex flex-col items-center select-none">
      {/* Curved Screen Element */}
      <div className="w-full max-w-2xl px-4 flex flex-col items-center">
        <div className="relative w-full h-12 flex items-center justify-center">
          {/* Glowing Arc Screen */}
          <div className="absolute top-0 w-full h-3 rounded-t-[100%] bg-gradient-to-b from-cyan-400 via-sky-300 to-transparent opacity-70 cinema-screen-glow" />
          <div className="absolute top-1 w-[90%] h-1 bg-cyan-200/90 rounded-full blur-[1px]" />
          <span className="text-[11px] font-bold tracking-[0.25em] text-cyan-200/80 uppercase pt-4">
            {screenType} Laser Projection Screen
          </span>
        </div>
      </div>

      {/* Seat Matrix Grid */}
      <div className="w-full overflow-x-auto pb-4 pt-2 flex justify-center">
        <div className="min-w-[580px] px-6 space-y-3">
          {rows.map((rowGroup) => (
            <div key={rowGroup.row} className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Left Row Label */}
              <span className="w-6 text-center text-xs font-bold text-slate-500 font-mono">
                {rowGroup.row}
              </span>

              {/* Seats in Row */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {rowGroup.seats.map((seat) => {
                  const selected = isSelected(seat.id);
                  const isAvailable = seat.isAvailable;
                  const isHeld = seat.isHeld;
                  const isBooked = seat.isBooked;

                  let seatStyle =
                    "bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-slate-400 hover:text-white";

                  if (selected) {
                    seatStyle =
                      "bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md shadow-amber-400/40 scale-105 z-10";
                  } else if (isBooked) {
                    seatStyle =
                      "bg-slate-900/60 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-50";
                  } else if (isHeld) {
                    seatStyle =
                      "bg-orange-950/40 text-orange-400 border-orange-800/60 cursor-not-allowed opacity-75";
                  } else if (seat.type === SEAT_TYPE.VIP) {
                    seatStyle =
                      "bg-amber-950/20 text-amber-300 border border-amber-600/60 hover:bg-amber-500/20 hover:border-amber-400";
                  } else if (seat.type === SEAT_TYPE.PREMIUM) {
                    seatStyle =
                      "bg-indigo-950/20 text-indigo-300 border border-indigo-600/60 hover:bg-indigo-500/20 hover:border-indigo-400";
                  }

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!isAvailable && !selected}
                      onClick={() => onToggleSeat(seat)}
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      title={`Seat ${seat.label} - ${seat.type} (${formatCents(seat.priceCents)}) - ${seat.status}`}
                      className={`relative group flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-xs font-semibold transition-all duration-150 ${seatStyle}`}
                    >
                      {selected ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : isBooked ? (
                        <X className="h-3.5 w-3.5 text-slate-600" />
                      ) : seat.type === SEAT_TYPE.ACCESSIBLE ? (
                        <Accessibility className="h-3.5 w-3.5" />
                      ) : seat.type === SEAT_TYPE.VIP ? (
                        <span className="text-[10px] font-mono">{seat.number}</span>
                      ) : (
                        <span className="text-[11px] font-mono">{seat.number}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Row Label */}
              <span className="w-6 text-center text-xs font-bold text-slate-500 font-mono">
                {rowGroup.row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tooltip Bar for Hovered Seat */}
      <div className="h-6 flex items-center justify-center text-xs">
        {hoveredSeat ? (
          <span className="text-slate-300 flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <span className="font-bold text-amber-400">Seat {hoveredSeat.label}</span>
            <span>•</span>
            <span className="uppercase text-[11px] tracking-wider text-slate-400">
              {hoveredSeat.type}
            </span>
            <span>•</span>
            <span className="font-semibold text-white">
              {formatCents(hoveredSeat.priceCents)}
            </span>
            <span>•</span>
            <span
              className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                hoveredSeat.isAvailable
                  ? "text-emerald-400"
                  : hoveredSeat.isHeld
                  ? "text-amber-400"
                  : "text-slate-500"
              }`}
            >
              {hoveredSeat.status}
            </span>
          </span>
        ) : (
          <span className="text-slate-500 text-xs">Hover or tap on a seat to inspect details</span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-800 border border-slate-700" />
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-indigo-950/40 border border-indigo-500/60" />
          <span>Premium (+$4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-950/40 border border-amber-500/60" />
          <span>VIP Recliner (+$8)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-400 border border-amber-300 shadow-sm" />
          <span className="font-semibold text-amber-400">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-orange-950/40 border border-orange-800/80" />
          <span className="text-orange-400">Held</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-900 border border-slate-800 opacity-50" />
          <span className="text-slate-500">Booked</span>
        </div>
      </div>
    </div>
  );
}
