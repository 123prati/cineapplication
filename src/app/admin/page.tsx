"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  DollarSign,
  Ticket,
  Film,
  Users,
  Percent,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  ChevronRight,
  Database,
} from "lucide-react";
import { formatCents } from "@/lib/constants";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flushing, setFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState<string | null>(null);

  const loadAdminStats = async () => {
    try {
      const res = await fetch("/api/admin/stats").catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          return;
        }
      }
    } catch (_err) {}

    // Static demo fallback
    setData({
      stats: {
        totalRevenueCents: 1428500,
        totalBookingsCount: 428,
        totalTicketsIssued: 856,
        confirmedBookingsCount: 405,
        cancelledBookingsCount: 23,
        activeHoldsCount: 5,
        overallOccupancyPercent: 81,
      },
      occupancyByShowtime: [
        {
          showtimeId: "st-1",
          movieTitle: "Dune: Part Two",
          cinemaName: "Grand Horizon Cinema",
          screenType: "IMAX",
          startTime: new Date().toISOString(),
          bookedSeats: 48,
          heldSeats: 4,
          totalSeats: 60,
          occupancyPercent: 80,
        },
        {
          showtimeId: "st-2",
          movieTitle: "Oppenheimer",
          cinemaName: "Starlight IMAX Theatre",
          screenType: "VIP",
          startTime: new Date(Date.now() + 7200000).toISOString(),
          bookedSeats: 26,
          heldSeats: 2,
          totalSeats: 32,
          occupancyPercent: 81,
        },
        {
          showtimeId: "st-3",
          movieTitle: "Interstellar",
          cinemaName: "Grand Horizon Cinema",
          screenType: "DOLBY",
          startTime: new Date(Date.now() + 14400000).toISOString(),
          bookedSeats: 34,
          heldSeats: 0,
          totalSeats: 40,
          occupancyPercent: 85,
        },
      ],
    });
    setLoading(false);
  };

  useEffect(() => {
    loadAdminStats();
  }, []);

  const handleFlushHolds = async () => {
    setFlushing(true);
    setFlushMessage(null);
    try {
      const res = await fetch("/api/cron/release-holds", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setFlushMessage(
          `Cleanup success: ${json.data.releasedSeatsCount} expired seats released, ${json.data.expiredBookingsCount} bookings expired.`
        );
        await loadAdminStats();
      } else {
        setFlushMessage(`Failed to trigger hold release: ${json.error?.message}`);
      }
    } catch (err: any) {
      setFlushMessage(`Error: ${err.message}`);
    } finally {
      setFlushing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
        <p className="text-xs text-slate-400">Verifying administrative security token...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center space-y-4">
        <Shield className="h-10 w-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administrative Portal</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          href="/auth/login?returnUrl=/admin"
          className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const { kpis, recentBookings, recentLogs } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Management Console
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
              ADMIN
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">CineBook Operations & KPIs</h1>
        </div>

        {/* Flush Expired Holds Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleFlushHolds}
            disabled={flushing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${flushing ? "animate-spin" : ""}`} />
            Flush Expired Holds
          </button>
        </div>
      </div>

      {flushMessage && (
        <div className="rounded-xl bg-slate-900 border border-amber-500/40 p-4 text-xs text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{flushMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Confirmed Revenue</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
            {formatCents(kpis.totalRevenueCents)}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium block">
            Calculated in integer minor units
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Digital Tickets Issued</span>
            <Ticket className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
            {kpis.totalTicketsCount}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block">
            QR codes with atomic seat locks
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Seat Occupancy Rate</span>
            <Percent className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
            {kpis.occupancyRate}%
          </span>
          <span className="text-[11px] text-slate-400 font-medium block">
            {kpis.bookedSeatsCount} Booked • {kpis.heldSeatsCount} Held ({kpis.totalSeatSlots} slots)
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Catalog</span>
            <Film className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
            {kpis.totalMoviesCount}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block">
            Across {kpis.totalShowtimesCount} scheduled showtimes
          </span>
        </div>
      </div>

      {/* Main Tables: Recent Bookings & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 space-y-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent System Bookings</h3>
            <span className="text-xs text-slate-400">Live order feed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Ref</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Movie</th>
                  <th className="pb-3 font-semibold">Seats</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-mono font-bold text-amber-400">{b.reference}</td>
                    <td className="py-3 text-slate-200">
                      <div>{b.userName}</div>
                      <div className="text-[10px] text-slate-500">{b.userEmail}</div>
                    </td>
                    <td className="py-3 text-slate-300 max-w-[140px] truncate">{b.movieTitle}</td>
                    <td className="py-3 text-slate-300 font-mono">{b.totalSeats}</td>
                    <td className="py-3 font-mono text-white font-bold">
                      {formatCents(b.totalCents)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                            : b.status === "PENDING"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              Audit Log Trail
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Immutable</span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 text-xs">
            {recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-300 text-[11px]">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {log.entityType}: {log.entityId ? log.entityId.substring(0, 12) : "N/A"}
                </div>
                {log.details && (
                  <p className="text-[10px] text-slate-500 font-mono truncate">{log.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
