// "use client";
// import { usePathname, useRouter } from "next/navigation";
// import { createClient } from "@/lib/supabase/client";
// import { useEffect, useState } from "react";
// import Link from "next/link";

// export default function AppLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [email, setEmail] = useState("");
//   const [loggingOut, setLoggingOut] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const supabase = createClient();

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data: { user } }) => {
//       if (!user) {
//         router.push("/login");
//         return;
//       }
//       setEmail(user.email || "");
//     });
//   }, []);

//   async function handleLogout() {
//     setLoggingOut(true);
//     await supabase.auth.signOut();
//     router.push("/login");
//   }

//   const links = [
//     { href: "/daily", label: "Today", icon: "☀️" },
//     { href: "/monthly", label: "Monthly", icon: "📅" },
//     { href: "/analytics", label: "Analytics", icon: "📊" },
//     { href: "/settings", label: "Settings", icon: "⚙️" },
//   ];

//   return (
//     <div
//       className="min-h-screen text-white"
//       style={{ backgroundColor: "#0a0a0f" }}
//     >
//       {/* Desktop + Mobile navbar */}
//       <nav
//         className="border-b border-gray-800/60 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md"
//         style={{ backgroundColor: "#0a0a0fee" }}
//       >
//         {/* Brand */}
//         <Link
//           href="/daily"
//           className="font-bold text-white text-base py-4 mr-6 shrink-0"
//         >
//           Tracker
//         </Link>

//         {/* Desktop links */}
//         <div className="hidden md:flex items-center flex-1">
//           {links.map((link) => {
//             const active = pathname === link.href;
//             return (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 className={`relative px-4 py-4 text-sm font-medium transition-colors ${
//                   active ? "text-white" : "text-gray-500 hover:text-gray-300"
//                 }`}
//               >
//                 {link.label}
//                 {active && (
//                   <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
//                 )}
//               </Link>
//             );
//           })}
//         </div>

//         {/* Desktop right */}
//         <div className="hidden md:flex items-center gap-4">
//           <span className="text-xs text-gray-600 truncate max-w-48">
//             {email}
//           </span>
//           <button
//             onClick={handleLogout}
//             disabled={loggingOut}
//             className="text-xs text-gray-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all"
//           >
//             {loggingOut ? "Signing out…" : "Sign out"}
//           </button>
//         </div>

//         {/* Mobile hamburger */}
//         <button
//           className="md:hidden p-2 text-gray-400 hover:text-white ml-auto"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           <div className="space-y-1.5">
//             <span
//               className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
//             />
//             <span
//               className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`}
//             />
//             <span
//               className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
//             />
//           </div>
//         </button>
//       </nav>

//       {/* Mobile dropdown menu */}
//       {menuOpen && (
//         <div
//           className="md:hidden border-b border-gray-800 px-4 py-3 space-y-1 sticky top-[57px] z-40 backdrop-blur-md"
//           style={{ backgroundColor: "#0a0a0fee" }}
//         >
//           {links.map((link) => {
//             const active = pathname === link.href;
//             return (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 onClick={() => setMenuOpen(false)}
//                 className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
//                   active
//                     ? "bg-violet-950/50 text-violet-300 border border-violet-900/50"
//                     : "text-gray-400 hover:text-white hover:bg-gray-800/50"
//                 }`}
//               >
//                 <span>{link.icon}</span>
//                 {link.label}
//               </Link>
//             );
//           })}
//           <div className="pt-2 border-t border-gray-800 flex items-center justify-between px-3">
//             <span className="text-xs text-gray-600 truncate">{email}</span>
//             <button
//               onClick={handleLogout}
//               className="text-xs text-red-400 hover:text-red-300"
//             >
//               Sign out
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Page content */}
//       {/* <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8"> */}
//       <main className="w-full px-4 md:px-8 py-6 md:py-8">
//         {children}
//       </main>

//       {/* Mobile bottom nav bar */}
//       <nav
//         className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-800/60 flex backdrop-blur-md z-50"
//         style={{ backgroundColor: "#0a0a0fee" }}
//       >
//         {links.map((link) => {
//           const active = pathname === link.href;
//           return (
//             <Link
//               key={link.href}
//               href={link.href}
//               className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
//                 active ? "text-violet-400" : "text-gray-600 hover:text-gray-400"
//               }`}
//             >
//               <span className="text-base">{link.icon}</span>
//               {link.label}
//               {active && (
//                 <span className="w-1 h-1 rounded-full bg-violet-500" />
//               )}
//             </Link>
//           );
//         })}
//       </nav>

//       {/* Bottom padding for mobile nav */}
//       <div className="md:hidden h-16" />
//     </div>
//   );
// }

"use client";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  {
    href: "/daily",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 1.8}
        strokeLinecap="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/monthly",
    label: "Monthly",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 1.8}
        strokeLinecap="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="7" y1="14" x2="7" y2="14" />
        <line x1="12" y1="14" x2="12" y2="14" />
        <line x1="17" y1="14" x2="17" y2="14" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 1.8}
        strokeLinecap="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: "/calories",
    label: "Calories",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round">
        <path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z" />
        <path d="M12 12c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z" />
      </svg>
    ),
  },
  {
    href: "/planner",
    label: "Planner",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="16" y2="7" />
        <line x1="9" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Task",
    icon: (active: boolean) => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 1.8}
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("U");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [habitScore, setHabitScore] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") || "dark") as "dark" | "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email || "");
      const name = (user.email || "").split("@")[0];
      const parts = name.split(/[._-]/);
      setInitials(
        parts
          .map((p: string) => p[0]?.toUpperCase() || "")
          .join("")
          .slice(0, 2) || "U",
      );
    });

    loadScore();
  }, []);

  async function loadScore() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const [{ data: tasks }, { data: comps }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user.id)
        .eq("active", true),
      supabase
        .from("completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today),
    ]);
    if (tasks?.length)
      setHabitScore(Math.round(((comps?.length || 0) / tasks.length) * 100));
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

  const SunIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
  const MoonIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
  const BellIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
  const LogoutIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
  const MenuIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--page)",
      }}
    >
      {/* ═══ SIDEBAR ═══ */}
      <aside
        style={{
          width: 72,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
          gap: 6,
          background: "var(--sidebar)",
          borderRight: "1px solid var(--border)",
          zIndex: 20,
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            flexShrink: 0,
          }}
        >
          <span style={{ color: "white", fontWeight: 800, fontSize: 18 }}>
            T
          </span>
        </div>

        {/* Nav */}
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              title={label}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: active ? "#a855f7" : "var(--text3)",
                background: active ? "rgba(139,92,246,0.12)" : "transparent",
                border: active
                  ? "1px solid rgba(139,92,246,0.2)"
                  : "1px solid transparent",
                transition: "all .2s",
                textDecoration: "none",
                position: "relative",
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: -1,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 22,
                    borderRadius: "0 4px 4px 0",
                    background: "linear-gradient(180deg,#7c3aed,#a855f7)",
                  }}
                />
              )}
              {icon(active)}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Theme */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text3)",
            background: "transparent",
            border: "1px solid transparent",
            cursor: "pointer",
            transition: "all .2s",
          }}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text3)",
            background: "transparent",
            border: "1px solid transparent",
            cursor: "pointer",
            transition: "all .2s",
          }}
        >
          <LogoutIcon />
        </button>
      </aside>

      {/* ═══ RIGHT COLUMN ═══ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* ═══ TOPBAR ═══ */}
        <header
          style={{
            height: 64,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            background: "var(--topbar)",
            borderBottom: "1px solid var(--border)",
            zIndex: 10,
          }}
        >
          {/* Mobile menu */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            style={{
              color: "var(--text2)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <MenuIcon />
          </button>

          {/* Score pill — center */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {habitScore !== null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 20px",
                  borderRadius: 100,
                  background: "var(--card2)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: habitScore === 100 ? "#10b981" : "#a855f7",
                  }}
                >
                  {habitScore}%
                </span>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>
                  of tasks completed today
                </span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--card2)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
                cursor: "pointer",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--card2)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <BellIcon />
            </button>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "white",
                cursor: "default",
              }}
              title={email}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* ═══ PAGE CONTENT ═══ */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {children}
        </main>
      </div>

      {/* ═══ MOBILE OVERLAY ═══ */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50 }}
          className="md:hidden"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 240,
              background: "var(--sidebar)",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              padding: "24px 16px",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                T
              </div>
              <span
                style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}
              >
                Tracker
              </span>
            </div>
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 12,
                    color: active ? "#a855f7" : "var(--text2)",
                    background: active ? "rgba(139,92,246,0.1)" : "transparent",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    transition: "all .2s",
                  }}
                >
                  {icon(active)}
                  {label}
                </Link>
              );
            })}
            <div style={{ flex: 1 }} />
            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <button
                onClick={toggleTheme}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  color: "var(--text2)",
                  fontSize: 14,
                }}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={logout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  color: "#ef4444",
                  fontSize: 14,
                }}
              >
                <LogoutIcon /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}