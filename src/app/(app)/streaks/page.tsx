"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell, Loader2, Sparkles, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskCategory } from "@/lib/types";

const SECTIONS = [
  { key: "habit" as TaskCategory, title: "Habits", color: "#7c3aed", icon: Sparkles },
  { key: "diet" as TaskCategory, title: "Diet", color: "#059669", icon: Utensils },
  { key: "workout" as TaskCategory, title: "Workout", color: "#dc2626", icon: Dumbbell },
];

type CompletionRow = {
  task_id: string;
  date: string;
};

type DayStatus = Record<TaskCategory, boolean | null>;

function isTaskActiveOnDate(task: Task, date: string) {
  return task.type === "recurring" || task.target_date === date;
}

export default function StreaksPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const today = new Date();
  const visibleEnd = isSameMonth(month, today) ? today : monthEnd;
  const days = eachDayOfInterval({ start: monthStart, end: visibleEnd });
  const monthStartKey = format(monthStart, "yyyy-MM-dd");
  const monthEndKey = format(monthEnd, "yyyy-MM-dd");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
    });
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    async function loadMonth() {
      setLoading(true);
      const [{ data: taskRows }, { data: completionRows }] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .eq("active", true)
          .order("position"),
        supabase
          .from("completions")
          .select("task_id, date")
          .eq("user_id", userId)
          .gte("date", monthStartKey)
          .lte("date", monthEndKey),
      ]);

      setTasks(
        ((taskRows || []) as Task[]).map((task) => ({
          ...task,
          category: task.category || "habit",
        })),
      );
      setCompletions((completionRows || []) as CompletionRow[]);
      setLoading(false);
    }

    loadMonth();
  }, [monthEndKey, monthStartKey, supabase, userId]);

  const dayStatuses = days.map((day) => {
    const date = format(day, "yyyy-MM-dd");
    const status = SECTIONS.reduce((acc, section) => {
      const categoryTasks = tasks.filter(
        (task) => (task.category || "habit") === section.key && isTaskActiveOnDate(task, date),
      );
      if (categoryTasks.length === 0) {
        acc[section.key] = null;
        return acc;
      }

      acc[section.key] = categoryTasks.every((task) =>
        completions.some((completion) => completion.task_id === task.id && completion.date === date),
      );
      return acc;
    }, {} as DayStatus);

    return { day, date, status };
  });

  const summary = SECTIONS.map((section) => {
    const eligibleDays = dayStatuses.filter((item) => item.status[section.key] !== null);
    const completeDays = eligibleDays.filter((item) => item.status[section.key] === true).length;
    const percent = eligibleDays.length ? Math.round((completeDays / eligibleDays.length) * 100) : 0;
    return { ...section, completeDays, totalDays: eligibleDays.length, percent };
  });

  const perfectDays = dayStatuses.filter((item) =>
    SECTIONS.every((section) => item.status[section.key] === true),
  ).length;

  return (
    <div className="mobile-page">
      <section className="page-heading streak-heading">
        <div>
          <p className="eyebrow">Streaks</p>
          <h1>{format(month, "MMMM yyyy")}</h1>
          <p>{perfectDays} perfect days across all three</p>
        </div>
      </section>

      <section className="mobile-card compact-controls">
        <button type="button" onClick={() => setMonth((current) => subMonths(current, 1))}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="active" onClick={() => setMonth(startOfMonth(new Date()))}>
          This month
        </button>
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          disabled={isAfter(addMonths(month, 1), startOfMonth(new Date()))}
        >
          <ChevronRight size={18} />
        </button>
      </section>

      {loading ? (
        <div className="center-state">
          <Loader2 className="spin" size={24} />
          <p>Loading streaks...</p>
        </div>
      ) : (
        <>
          <section className="streak-summary">
            {summary.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.key} className="streak-stat">
                  <Icon size={18} color={item.color} />
                  <strong>{item.completeDays}/{item.totalDays}</strong>
                  <span>{item.title}</span>
                  <div>
                    <span style={{ width: `${item.percent}%`, background: item.color }} />
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mobile-card">
            <div className="month-grid-head">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="month-grid">
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
                <span key={`blank-${index}`} />
              ))}
              {dayStatuses.map((item) => (
                <article key={item.date} className="month-day">
                  <strong>{format(item.day, "d")}</strong>
                  <div>
                    {SECTIONS.map((section) => (
                      <span
                        key={section.key}
                        style={{
                          background:
                            item.status[section.key] === true
                              ? section.color
                              : item.status[section.key] === false
                                ? "var(--card3)"
                                : "transparent",
                          borderColor:
                            item.status[section.key] === null ? "var(--card3)" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
