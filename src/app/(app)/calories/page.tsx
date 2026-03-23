"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FoodLog } from "@/lib/types";
import { format } from "date-fns";

const MEALS = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch",     label: "Lunch",     emoji: "☀️"  },
  { key: "dinner",    label: "Dinner",    emoji: "🌙" },
  { key: "snack",     label: "Snack",     emoji: "🍎" },
  { key: "other",     label: "Other",     emoji: "🍽️"  },
] as const;

function ring(pct: number, color: string, size = 120, stroke = 10) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--card3)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray .7s ease" }} />
    </svg>
  );
}

export default function CaloriesPage() {
  const supabase = createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentYM = format(new Date(), "yyyy-MM");

  // ── State ──
  const [selectedYM, setSelectedYM] = useState(currentYM);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  const [goalInput, setGoalInput] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Form state
  const [description, setDescription] = useState("");
  const [meal, setMeal] = useState<FoodLog["meal_type"]>("breakfast");
  const [manualKcal, setManualKcal] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // ── Init ──
  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (userId) fetchGoal(userId, selectedYM);
  }, [selectedYM, userId]);

  useEffect(() => {
    if (userId) fetchLogs(userId);
  }, [userId]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    await Promise.all([fetchGoal(user.id, currentYM), fetchLogs(user.id)]);
  }

  async function fetchGoal(uid: string, ym: string) {
    const { data } = await supabase
      .from("calorie_goal")
      .select("*")
      .eq("user_id", uid)
      .eq("year_month", ym)
      .maybeSingle();
    if (data) {
      setDailyGoal(data.daily_calories);
      setGoalInput(String(data.daily_calories));
    } else {
      setDailyGoal(null);
      setGoalInput("");
    }
  }

  async function fetchLogs(uid: string) {
    setLoadingLogs(true);
    const { data } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", uid)
      .eq("date", today)
      .order("created_at");
    setLogs((data as FoodLog[]) || []);
    setLoadingLogs(false);
  }

  async function saveGoal() {
    if (!goalInput || isNaN(+goalInput)) return;
    await supabase.from("calorie_goal").upsert(
      { user_id: userId, year_month: selectedYM, daily_calories: +goalInput },
      { onConflict: "user_id,year_month" }
    );
    setDailyGoal(+goalInput);
    setGoalSaved(true);
    setEditingGoal(false);
    setTimeout(() => setGoalSaved(false), 2000);
  }

  async function addLog() {
    const kcal = +manualKcal;
    if (!kcal || kcal <= 0) { setError("Valid calories required"); return; }
    if (!description.trim()) { setError("Description required"); return; }
    setAdding(true);
    await supabase.from("food_logs").insert({
      user_id: userId,
      date: today,
      meal_type: meal,
      description: description,
      calories: kcal,
      protein: null,
    });
    // Reset form
    setDescription("");
    setManualKcal("");
    setError("");
    await fetchLogs(userId);
    setAdding(false);
  }

  async function deleteLog(id: string) {
    await supabase.from("food_logs").delete().eq("id", id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  // ── Computed ──
  const totalKcal = logs.reduce((s, l) => s + l.calories, 0);
  const totalProtein = logs.reduce((s, l) => s + (l.protein || 0), 0);
  const ringPct = dailyGoal ? (totalKcal / dailyGoal) * 100 : 0;
  const ringColor = !dailyGoal ? "#6b7280"
    : ringPct >= 110 ? "#ef4444"
    : ringPct >= 90  ? "#f59e0b"
    : "#10b981";
  const remaining = dailyGoal ? dailyGoal - totalKcal : null;

  // Month options (current + 12 past)
  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text3)", marginBottom: 4 }}>
            Nutrition
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", lineHeight: 1.1 }}>
            Calories
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <select
            value={selectedYM}
            onChange={e => setSelectedYM(e.target.value)}
            style={{ width: "auto", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── GOAL + RING ── */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", padding: "28px 32px", alignItems: "center" }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 120, height: 120 }}>
          {ring(ringPct, ringColor)}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: ringColor, lineHeight: 1 }}>
              {Math.round(ringPct)}%
            </span>
            <span style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>of goal</span>
          </div>
        </div>

        {/* Stats + Goal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 32, fontWeight: 900, color: ringColor, lineHeight: 1 }}>{totalKcal.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>kcal consumed</p>
            </div>
            {dailyGoal && (
              <div>
                <p style={{ fontSize: 32, fontWeight: 900, color: remaining! >= 0 ? "var(--text2)" : "#ef4444", lineHeight: 1 }}>
                  {Math.abs(remaining!).toLocaleString()}
                </p>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                  {remaining! >= 0 ? "kcal remaining" : "kcal over goal"}
                </p>
              </div>
            )}
            {totalProtein > 0 && (
              <div>
                <p style={{ fontSize: 32, fontWeight: 900, color: "#0ea5e9", lineHeight: 1 }}>{Math.round(totalProtein)}g</p>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>protein</p>
              </div>
            )}
          </div>

          {/* Goal setter */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!editingGoal && dailyGoal ? (
              <>
                <span style={{ fontSize: 13, color: "var(--text3)" }}>Daily goal: <b style={{ color: "var(--text)" }}>{dailyGoal.toLocaleString()} kcal</b> for {monthOptions.find(m => m.value === selectedYM)?.label}</span>
                <button onClick={() => setEditingGoal(true)} style={{ fontSize: 12, color: "#a855f7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Edit</button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px" }}>
                  <span style={{ fontSize: 13, color: "var(--text3)" }}>Daily goal:</span>
                  <input
                    type="number"
                    placeholder="e.g. 1800"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveGoal()}
                    style={{ width: 90, background: "transparent", border: "none", fontSize: 14, fontWeight: 700, padding: 0, outline: "none" }}
                  />
                  <span style={{ fontSize: 13, color: "var(--text3)" }}>kcal</span>
                </div>
                <button onClick={saveGoal} style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer", background: goalSaved ? "#10b981" : "#a855f7", color: "white", fontSize: 13, fontWeight: 700, transition: "background .2s" }}>
                  {goalSaved ? "✓ Saved" : "Save"}
                </button>
                {editingGoal && <button onClick={() => setEditingGoal(false)} style={{ padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "var(--card2)", color: "var(--text3)", fontSize: 13 }}>Cancel</button>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── LOG FOOD FORM ── */}
      <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", padding: "24px 28px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", marginBottom: 18 }}>Log Food</p>

        {/* Meal selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {MEALS.map(m => (
            <button key={m.key} onClick={() => setMeal(m.key as FoodLog["meal_type"])}
              style={{ padding: "6px 14px", borderRadius: 100, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s",
                borderColor: meal === m.key ? "#a855f7" : "var(--border)",
                background: meal === m.key ? "rgba(168,85,247,0.12)" : "transparent",
                color: meal === m.key ? "#a855f7" : "var(--text3)",
              }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {/* Text input */}
          <input
            placeholder='Food description e.g. "200g oats"'
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ flex: "1 1 200px", padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)", fontSize: 13, outline: "none" }}
          />

          {/* Kcal input */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card2)" }}>
            <input
              type="number"
              placeholder="0"
              value={manualKcal}
              onChange={e => setManualKcal(e.target.value)}
              style={{ width: 60, background: "transparent", border: "none", color: "var(--text)", fontSize: 14, fontWeight: 700, outline: "none" }}
            />
            <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 600 }}>kcal</span>
          </div>

          <button onClick={addLog} disabled={adding}
            style={{ padding: "10px 24px", borderRadius: 12, border: "none", cursor: adding ? "wait" : "pointer",
              background: "#10b981", color: "white", fontSize: 13, fontWeight: 700, transition: "all .2s", height: 42 }}>
            {adding ? "Saving…" : "✓ Add to Log"}
          </button>
        </div>

        {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 10 }}>{error}</p>}
      </div>

      {/* ── TODAY'S LOG ── */}
      <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)" }}>
            Today — {format(new Date(), "EEEE, MMM d")}
          </p>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{totalKcal.toLocaleString()} kcal total</span>
        </div>

        {loadingLogs ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: 12, background: "var(--card2)", animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🍽️</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)" }}>No food logged today</p>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Use the form above to log your meals</p>
          </div>
        ) : (
          MEALS.map(mealType => {
            const items = logs.filter(l => l.meal_type === mealType.key);
            if (items.length === 0) return null;
            const mealKcal = items.reduce((s, l) => s + l.calories, 0);
            return (
              <div key={mealType.key} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)" }}>
                    {mealType.emoji} {mealType.label}
                  </p>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{mealKcal} kcal</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map(log => (
                    <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "var(--card2)", border: "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.description}</p>
                        {log.protein && log.protein > 0 ? (
                          <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{log.protein}g protein</p>
                        ) : null}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#a855f7", flexShrink: 0 }}>{log.calories} kcal</span>
                      <button onClick={() => deleteLog(log.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
