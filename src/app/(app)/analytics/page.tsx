"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, startOfMonth, eachDayOfInterval } from "date-fns";

const CAT_COLORS: Record<string, string> = {
  Food: "#a855f7",
  Transport: "#0ea5e9",
  Shopping: "#f59e0b",
  Health: "#10b981",
  Entertainment: "#ec4899",
  Bills: "#ef4444",
  Other: "#6b7280",
};

export default function AnalyticsPage() {
  const supabase = createClient();
  const [spends, setSpends] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("month");

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const from =
      period === "week"
        ? format(subDays(new Date(), 6), "yyyy-MM-dd")
        : format(startOfMonth(new Date()), "yyyy-MM-dd");
    const to = format(new Date(), "yyyy-MM-dd");
    const [{ data: s }, { data: c }, { data: t }] = await Promise.all([
      supabase
        .from("spends")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", from)
        .lte("date", to),
      supabase
        .from("completions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", from)
        .lte("date", to),
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true),
    ]);
    setSpends(s || []);
    setCompletions(c || []);
    setTasks(t || []);
    setLoading(false);
  }

  const days =
    period === "week"
      ? Array.from({ length: 7 }, (_, i) =>
          format(subDays(new Date(), 6 - i), "yyyy-MM-dd"),
        )
      : eachDayOfInterval({
          start: startOfMonth(new Date()),
          end: new Date(),
        }).map((d) => format(d, "yyyy-MM-dd"));

  const totalSpend = spends.reduce((s, x) => s + Number(x.amount), 0);
  const avgDailySpend =
    days.length > 0 ? Math.round(totalSpend / days.length) : 0;

  const spendByCategory = Object.keys(CAT_COLORS)
    .map((cat) => ({
      cat,
      total: spends
        .filter((s) => s.category === cat)
        .reduce((sum, s) => sum + Number(s.amount), 0),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  const dailySpends = days.map((day) => ({
    day,
    label: format(new Date(day + "T00:00:00"), period === "week" ? "EEE" : "d"),
    amount: spends
      .filter((s) => s.date === day)
      .reduce((sum, s) => sum + Number(s.amount), 0),
  }));
  const maxSpend = Math.max(...dailySpends.map((d) => d.amount), 1);

  const habitByDay = days.map((day) => {
    const active = tasks.filter(
      (t) => t.type === "recurring" || t.target_date === day,
    );
    const done = completions.filter(
      (c) => c.date === day && active.some((t) => t.id === c.task_id),
    ).length;
    return {
      day,
      label: format(
        new Date(day + "T00:00:00"),
        period === "week" ? "EEE" : "d",
      ),
      pct: active.length > 0 ? Math.round((done / active.length) * 100) : 0,
      total: active.length,
    };
  });

  const validHabitDays = habitByDay.filter((d) => d.total > 0);
  const avgHabit =
    validHabitDays.length > 0
      ? Math.round(
          validHabitDays.reduce((s, d) => s + d.pct, 0) / validHabitDays.length,
        )
      : 0;
  const perfectDays = habitByDay.filter(
    (d) => d.pct === 100 && d.total > 0,
  ).length;

  const habitByTask = tasks
    .filter((t) => t.type === "recurring")
    .map((task) => {
      const done = completions.filter((c) => c.task_id === task.id).length;
      return {
        task,
        done,
        total: days.length,
        pct: days.length > 0 ? Math.round((done / days.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const card = (children: React.ReactNode, accentColor: string) => (
    <div
      style={{
        borderRadius: "16px",
        padding: "24px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${accentColor}`,
        position: "relative",
      }}
    >
      {children}
    </div>
  );

  if (loading)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            height: "48px",
            width: "192px",
            borderRadius: "12px",
            background: "var(--card)",
            animation: "pulse 2s infinite",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "16px",
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                height: "112px",
                borderRadius: "16px",
                background: "var(--card)",
                animation: "pulse 2s infinite",
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                height: "224px",
                borderRadius: "16px",
                background: "var(--card)",
                animation: "pulse 2s infinite",
              }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text3)",
              marginBottom: "4px",
            }}
          >
            Insights
          </p>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              lineHeight: 1.1,
            }}
          >
            Analytics
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--border)",
            marginTop: "8px",
          }}
        >
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: period === p ? "#a855f7" : "var(--card)",
                color: period === p ? "#fff" : "var(--text2)",
                transition: "all .2s",
              }}
            >
              {p === "week" ? "Last 7 days" : "This month"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
        }}
      >
        {/* On md+ screens would be 4 cols but we keep it simple */}
        {[
          {
            label: "Total spent",
            value: `₹${totalSpend.toLocaleString("en-IN")}`,
            color: "#ef4444",
          },
          {
            label: "Avg daily spend",
            value: `₹${avgDailySpend.toLocaleString("en-IN")}`,
            color: "#f59e0b",
          },
          { label: "Habit score", value: `${avgHabit}%`, color: "#a855f7" },
          {
            label: "Perfect days",
            value: String(perfectDays),
            color: "#10b981",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              borderRadius: "16px",
              padding: "24px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderTop: `3px solid ${s.color}`,
              minHeight: "110px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text3)",
              }}
            >
              {s.label}
            </p>
            <p style={{ fontSize: "30px", fontWeight: 800, color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts 2-col grid */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        {/* Daily spend */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #10b981",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text3)",
              marginBottom: "24px",
            }}
          >
            Daily spending
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "4px",
              height: "140px",
              marginBottom: "12px",
            }}
          >
            {dailySpends.map((d) => {
              const h = Math.max(
                (d.amount / maxSpend) * 120,
                d.amount > 0 ? 8 : 3,
              );
              const isToday_ = d.day === format(new Date(), "yyyy-MM-dd");
              return (
                <div
                  key={d.day}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "6px",
                    height: "140px",
                  }}
                >
                  {d.amount > 0 && (
                    <span style={{ fontSize: "9px", color: "var(--text3)" }}>
                      ₹
                      {d.amount >= 1000
                        ? Math.round(d.amount / 1000) + "k"
                        : d.amount}
                    </span>
                  )}
                  <div
                    style={{
                      width: "100%",
                      borderRadius: "4px 4px 0 0",
                      height: `${h}px`,
                      background: isToday_ ? "#a855f7" : "#a855f730",
                      minHeight: "3px",
                      transition: "height .7s",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: isToday_ ? "#a855f7" : "var(--text3)",
                      fontWeight: isToday_ ? 700 : 400,
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit score */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #a855f7",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text3)",
              marginBottom: "24px",
            }}
          >
            Daily habit score
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "4px",
              height: "120px",
              marginBottom: "12px",
            }}
          >
            {habitByDay.map((d) => {
              const h = Math.max((d.pct / 100) * 100, d.total > 0 ? 4 : 2);
              const barColor =
                d.pct === 100
                  ? "#10b981"
                  : d.pct >= 50
                    ? "#f59e0b"
                    : d.total > 0
                      ? "#ef4444"
                      : "var(--card2)";
              return (
                <div
                  key={d.day}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "6px",
                    height: "120px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      borderRadius: "4px 4px 0 0",
                      height: `${h}px`,
                      background: barColor,
                      opacity: d.total > 0 ? 1 : 0.3,
                      minHeight: "2px",
                      transition: "height .7s",
                    }}
                  />
                  <span style={{ fontSize: "10px", color: "var(--text3)" }}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              paddingTop: "8px",
              borderTop: "1px solid var(--border)",
            }}
          >
            {[
              { c: "#10b981", l: "100%" },
              { c: "#f59e0b", l: "50-99%" },
              { c: "#ef4444", l: "<50%" },
            ].map((x) => (
              <div
                key={x.l}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: x.c,
                  }}
                />
                <span style={{ fontSize: "11px", color: "var(--text2)" }}>
                  {x.l}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spend by category */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #f59e0b",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text3)",
              marginBottom: "24px",
            }}
          >
            Spend by category
          </p>
          {spendByCategory.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "128px",
              }}
            >
              <p style={{ color: "var(--text3)", fontSize: "13px" }}>
                No spend data for this period
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {spendByCategory.map(({ cat, total }) => (
                <div key={cat}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: CAT_COLORS[cat],
                        }}
                      />
                      <span style={{ fontSize: "13px", color: "var(--text2)" }}>
                        {cat}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      ₹{total.toLocaleString("en-IN")}
                      <span
                        style={{
                          color: "var(--text3)",
                          fontWeight: 400,
                          marginLeft: "8px",
                          fontSize: "12px",
                        }}
                      >
                        {totalSpend > 0
                          ? Math.round((total / totalSpend) * 100)
                          : 0}
                        %
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      borderRadius: "100px",
                      overflow: "hidden",
                      background: "var(--card2)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "100px",
                        width: `${totalSpend > 0 ? (total / totalSpend) * 100 : 0}%`,
                        background: CAT_COLORS[cat],
                        transition: "width .7s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habit consistency */}
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #0ea5e9",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text3)",
              marginBottom: "24px",
            }}
          >
            Habit consistency
          </p>
          {habitByTask.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "128px",
              }}
            >
              <p style={{ color: "var(--text3)", fontSize: "13px" }}>
                No habit data yet
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {habitByTask.map(({ task, done, total, pct }) => (
                <div key={task.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: task.color,
                        }}
                      />
                      <span style={{ fontSize: "13px", color: "var(--text2)" }}>
                        {task.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      {done}/{total}
                      <span
                        style={{
                          color: "var(--text3)",
                          fontWeight: 400,
                          marginLeft: "8px",
                          fontSize: "12px",
                        }}
                      >
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      borderRadius: "100px",
                      overflow: "hidden",
                      background: "var(--card2)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "100px",
                        width: `${pct}%`,
                        background: task.color,
                        transition: "width .7s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spend breakdown */}
      {spendByCategory.length > 0 && (
        <div
          style={{
            borderRadius: "16px",
            padding: "24px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "3px solid #ec4899",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text3)",
              marginBottom: "20px",
            }}
          >
            Spend breakdown
          </p>
          <div
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              height: "20px",
              marginBottom: "20px",
            }}
          >
            {spendByCategory.map(({ cat, total }) => (
              <div
                key={cat}
                title={`${cat}: ₹${total}`}
                style={{
                  height: "100%",
                  width: `${totalSpend > 0 ? (total / totalSpend) * 100 : 0}%`,
                  background: CAT_COLORS[cat],
                  transition: "width .7s",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {spendByCategory.map(({ cat, total }) => (
              <div
                key={cat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  background: "var(--card2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: CAT_COLORS[cat],
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--text2)" }}>
                  {cat}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text)",
                    fontWeight: 700,
                  }}
                >
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
