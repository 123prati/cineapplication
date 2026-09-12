"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Film, Ticket, Shield, LogOut, User, Sparkles, MapPin } from "lucide-react";

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch session on mount and route change
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me").catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setUser(data.data.user);
          return;
        }
      } catch {}

      // Check localStorage for static demo mode
      try {
        const stored = localStorage.getItem("cinebook_user");
        if (stored) {
          setUser(JSON.parse(stored));
          return;
        }
      } catch {}

      setUser(null);
      setIsLoading(false);
    }
    checkAuth().finally(() => setIsLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    } catch (e) {
      console.error(e);
    }
    try {
      localStorage.removeItem("cinebook_user");
    } catch {}
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const handleQuickLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setUser(data.data.user);
        router.refresh();
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Static fallback
    const role = email.includes("admin") ? "ADMIN" : "USER";
    const demoUser: UserSession = {
      userId: `demo-${Date.now()}`,
      name: email.includes("admin") ? "Cinema Admin" : "Demo Customer",
      email,
      role: role as any,
    };
    try {
      localStorage.setItem("cinebook_user", JSON.stringify(demoUser));
    } catch {}
    setUser(demoUser);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Cine<span className="text-amber-400">Book</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 ml-1">
                Pro
              </span>
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link
            href="/movies"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/movies")
                ? "bg-slate-800 text-amber-400"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Movies
          </Link>
          <Link
            href="/cinemas"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/cinemas")
                ? "bg-slate-800 text-amber-400"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Cinemas
          </Link>
          {user && (
            <Link
              href="/bookings"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/bookings")
                  ? "bg-slate-800 text-amber-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Ticket className="h-4 w-4" />
              My Bookings
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/admin")
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right Actions / Auth */}
        <div className="flex items-center space-x-3">
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">
                      {user.role === "ADMIN" ? "Administrator" : "Customer"}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* Quick Demo Switcher */}
                  <div className="hidden lg:flex items-center space-x-1 border border-slate-800 rounded-lg p-1 bg-slate-900/50 text-xs">
                    <span className="text-slate-400 px-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-400" /> Demo:
                    </span>
                    <button
                      onClick={() => handleQuickLogin("customer@cinebook.com", "Password123!")}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                    >
                      Customer
                    </button>
                    <button
                      onClick={() => handleQuickLogin("admin@cinebook.com", "AdminPassword123!")}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium"
                    >
                      Admin
                    </button>
                  </div>

                  <Link
                    href="/auth/login"
                    className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20 transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
