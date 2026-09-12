"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Film, Lock, Mail, User, Loader2, AlertCircle } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
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

    // Static demo fallback register
    const demoUser = {
      userId: `demo-user-${Date.now()}`,
      name: name || "Demo User",
      email,
      role: "USER",
    };
    try {
      localStorage.setItem("cinebook_user", JSON.stringify(demoUser));
    } catch {}

    router.push(returnUrl);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
          <Film className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Create Your CineBook Account
        </h1>
        <p className="text-xs text-slate-400">
          Join CineBook to reserve luxury seats, unlock VIP formats, and view tickets.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-800/80 p-3.5 text-xs text-red-300 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Register Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-800"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full rounded-xl bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>
        </div>

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
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Password (min 8 chars)
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              minLength={8}
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
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              href={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="text-amber-400 hover:underline font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
