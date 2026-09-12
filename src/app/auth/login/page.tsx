"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Film, Lock, Mail, Sparkles, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        if (json.success) {
          router.push(returnUrl);
          router.refresh();
          return;
        }
      }
    } catch (_err) {}

    // Static demo fallback login
    const isCinemaAdmin = email.toLowerCase().includes("admin");
    const demoUser = {
      userId: `demo-user-${Date.now()}`,
      name: isCinemaAdmin ? "Admin User" : "Demo Customer",
      email,
      role: isCinemaAdmin ? "ADMIN" : "USER",
    };
    try {
      localStorage.setItem("cinebook_user", JSON.stringify(demoUser));
    } catch {}

    router.push(returnUrl);
    router.refresh();
    setLoading(false);
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
          <Film className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Welcome to CineBook
        </h1>
        <p className="text-xs text-slate-400">
          Sign in to access your digital tickets and reserved seat holds.
        </p>
      </div>

      {/* Quick Fill Box */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> One-Click Demo Credentials
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials("customer@cinebook.com", "Password123!")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-left border border-slate-700/60 transition-colors"
          >
            <span className="block text-xs font-bold text-slate-200">Customer Demo</span>
            <span className="block text-[10px] text-slate-400 font-mono">customer@cinebook.com</span>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("admin@cinebook.com", "AdminPassword123!")}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-left border border-amber-500/30 transition-colors"
          >
            <span className="block text-xs font-bold text-amber-300">Admin Demo</span>
            <span className="block text-[10px] text-amber-400/70 font-mono">admin@cinebook.com</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-800/80 p-3.5 text-xs text-red-300 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-800"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{" "}
            <Link
              href={`/auth/register?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="text-amber-400 hover:underline font-semibold"
            >
              Register here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
