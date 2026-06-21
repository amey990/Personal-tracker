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
import { getWorkoutExercises, isTaskActiveOnDate } from "@/lib/taskSchedule";

const SECTIONS = [
  { key: "habit" as TaskCategory, title: "Habits", color: "#7c3aed", icon: Sparkles },
  { key: "diet" as TaskCategory, title: "Diet", color: "#059669", icon: Utensils },
  { key: "workout" as TaskCategory, title: "Workout", color: "#dc2626", icon: Dumbbell },
];

type CompletionRow = {
  task_id: string;
  date: string;
  completed: boolean;
  completed_exercises?: number[] | null;
};

type MissedItem = {
  taskId: string;
  title: string;
  exercise?: string;
};

type CategoryDay = {
  day: Date;
  date: string;
  total: number;
  done: number;
  status: "none" | "complete" | "partial" | "missed";
  missed: MissedItem[];
};

type DayStatus = Record<TaskCategory, CategoryDay>;

type SelectedDay = {
  section: (typeof SECTIONS)[number];
  item: CategoryDay;
} | null;

export default function StreaksPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<SelectedDay>(null);

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
          .select("task_id, date, completed, completed_exercises")
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

  const getCategoryDay = (section: (typeof SECTIONS)[number], day: Date): CategoryDay => {
    const date = format(day, "yyyy-MM-dd");
    const categoryTasks = tasks.filter(
      (task) => (task.category || "habit") === section.key && isTaskActiveOnDate(task, day, date),
    );

    if (categoryTasks.length === 0) {
      return { day, date, total: 0, done: 0, status: "none", missed: [] };
    }

    const taskResults = categoryTasks.map((task) => {
      const completion = completions.find(
        (item) => item.task_id === task.id && item.date === date,
      );

      if (section.key !== "workout") {
        return {
          done: Boolean(completion?.completed),
          missed: completion?.completed ? [] : [{ taskId: task.id, title: task.name }],
        };
      }

      const exercises = getWorkoutExercises(task);
      const completedExercises = Array.isArray(completion?.completed_exercises)
        ? completion.completed_exercises
        : [];

      if (exercises.length === 0) {
        return {
          done: Boolean(completion?.completed),
          missed: completion?.completed ? [] : [{ taskId: task.id, title: task.name }],
        };
      }

      const missedExercises = exercises
        .map((exercise, index) => ({ exercise, index }))
        .filter(({ index }) => !completedExercises.includes(index))
        .map(({ exercise }) => ({ taskId: task.id, title: task.name, exercise }));

      return {
        done: missedExercises.length === 0,
        missed: missedExercises,
      };
    });

    const done = taskResults.filter((item) => item.done).length;
    return {
      day,
      date,
      total: categoryTasks.length,
      done,
      status:
        done === categoryTasks.length
          ? "complete"
          : done === 0
            ? "missed"
            : "partial",
      missed: taskResults.flatMap((item) => item.missed),
    };
  };

  const dayStatuses = days.map((day) => {
    const status = SECTIONS.reduce((acc, section) => {
      acc[section.key] = getCategoryDay(section, day);
      return acc;
    }, {} as DayStatus);

    return { day, date: format(day, "yyyy-MM-dd"), status };
  });

  const perfectDays = dayStatuses.filter((item) =>
    SECTIONS.every((section) => item.status[section.key].status === "complete"),
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
        <button
          type="button"
          onClick={() => {
            setSelectedDay(null);
            setMonth((current) => subMonths(current, 1));
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="active"
          onClick={() => {
            setSelectedDay(null);
            setMonth(startOfMonth(new Date()));
          }}
        >
          This month
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedDay(null);
            setMonth((current) => addMonths(current, 1));
          }}
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
          <section className="streak-calendars">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <article key={section.key} className="mobile-card category-calendar">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Calendar</p>
                      <h2 className="section-title">{section.title}</h2>
                    </div>
                    <Icon size={19} color={section.color} />
                  </div>
                  <div className="month-grid-head">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <span key={`${section.key}-${day}-${index}`}>{day}</span>
                    ))}
                  </div>
                  <div className="month-grid">
                    {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
                      <span key={`${section.key}-blank-${index}`} />
                    ))}
                    {dayStatuses.map((dayStatus) => {
                      const item = dayStatus.status[section.key];
                      const isSelected =
                        selectedDay?.section.key === section.key &&
                        selectedDay.item.date === item.date;
                      return (
                        <button
                          key={`${section.key}-${item.date}`}
                          type="button"
                          className={`month-day category-day ${item.status} ${isSelected ? "selected" : ""}`}
                          onClick={() =>
                            item.status !== "none"
                              ? setSelectedDay({ section, item })
                              : setSelectedDay(null)
                          }
                          disabled={item.status === "none"}
                        >
                          <strong>{format(item.day, "d")}</strong>
                          <span aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>

          {selectedDay && (
            <section className="mobile-card missed-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">{format(selectedDay.item.day, "EEEE, MMMM d")}</p>
                  <h2 className="section-title">{selectedDay.section.title}</h2>
                </div>
                <button type="button" className="small-button" onClick={() => setSelectedDay(null)}>
                  Close
                </button>
              </div>
              {selectedDay.item.status === "complete" ? (
                <p className="muted">Everything was completed.</p>
              ) : (
                <div className="missed-list">
                  {selectedDay.item.missed.map((item, index) => (
                    <article key={`${item.taskId}-${item.exercise || "task"}-${index}`}>
                      <strong>{item.exercise || item.title}</strong>
                      {item.exercise && <span>{item.title}</span>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
