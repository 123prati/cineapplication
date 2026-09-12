"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

export interface CountdownTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ initialSeconds, onExpire, className = "" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining > 0 && remaining < 120; // less than 2 minutes
  const isExpired = remaining <= 0;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
        isExpired
          ? "bg-red-950/40 border-red-800/80 text-red-400"
          : isUrgent
          ? "bg-amber-950/40 border-amber-500/80 text-amber-400 animate-pulse"
          : "bg-slate-900/80 border-slate-700/80 text-slate-200"
      } ${className}`}
    >
      {isUrgent ? (
        <AlertTriangle className="h-4 w-4 text-amber-400" />
      ) : (
        <Clock className="h-4 w-4 text-slate-400" />
      )}
      <span>{isExpired ? "EXPIRED" : `Hold Expires In: ${formattedTime}`}</span>
    </div>
  );
}
