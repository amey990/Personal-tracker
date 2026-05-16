"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CalendarCheck, CheckSquare, LayoutDashboard, LogOut, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/daily", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: BookOpen },
  { href: "/settings", label: "Tasks", icon: CheckSquare },
  { href: "/streaks", label: "Streaks", icon: CalendarCheck },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = (localStorage.getItem("theme") || "dark") as "dark" | "light";
      setTheme(savedTheme);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    NAV.forEach(({ href }) => router.prefetch(href));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
    });
  }, [router, supabase]);

  function goTo(href: string) {
    if (pathname === href) return;
    startTransition(() => router.push(href));
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-chip" type="button" onClick={() => goTo("/daily")}>
          <span>T</span>
          <strong>Tracker</strong>
        </button>

        <div className="header-actions">
          <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className="icon-button danger" onClick={logout} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="app-content">
        {isPending && <div className="route-loading" />}
        {children}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              type="button"
              className={active ? "active" : ""}
              onClick={() => goTo(href)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
