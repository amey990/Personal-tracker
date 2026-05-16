"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Check, Dumbbell, Loader2, Plus, Sparkles, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskCategory, TaskWithStatus } from "@/lib/types";
import { getWorkoutExercises, isTaskActiveOnDate } from "@/lib/taskSchedule";

const SECTIONS: {
  key: TaskCategory;
  title: string;
  color: string;
  icon: ElementType;
}[] = [
  { key: "habit", title: "Habits", color: "#7c3aed", icon: Sparkles },
  { key: "diet", title: "Diet", color: "#059669", icon: Utensils },
  { key: "workout", title: "Workout", color: "#dc2626", icon: Dumbbell },
];

type CompletionRow = {
  id: string;
  task_id: string;
  date: string;
  completed: boolean;
  completed_exercises?: number[] | null;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickingId, setTickingId] = useState<string | null>(null);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
    });
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    async function loadTasks() {
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
          .select("id, task_id, date, completed, completed_exercises")
          .eq("user_id", userId)
          .eq("date", selectedDateStr),
      ]);

      const activeForDay = ((taskRows || []) as Task[]).filter((task) =>
        isTaskActiveOnDate(task, selectedDate, selectedDateStr),
      );

      setTasks(
        activeForDay.map((task) => {
          const completion = (completionRows as CompletionRow[] | null)?.find(
            (item) => item.task_id === task.id,
          );
          const exercises = getWorkoutExercises(task);
          const completedExercises = Array.isArray(completion?.completed_exercises)
            ? completion.completed_exercises
            : [];
          const completed =
            (task.category || "habit") === "workout" && exercises.length > 0
              ? completedExercises.length === exercises.length
              : Boolean(completion?.completed);

          return {
            ...task,
            category: task.category || "habit",
            completed,
            completion_id: completion?.id,
            completedExercises,
          };
        }),
      );
      setLoading(false);
    }

    loadTasks();
  }, [selectedDate, selectedDateStr, supabase, userId]);

  async function toggleTask(task: TaskWithStatus) {
    if (!userId || tickingId) return;

    setTickingId(task.id);
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, completed: !item.completed } : item,
      ),
    );

    if (task.completed) {
      await supabase
        .from("completions")
        .delete()
        .eq("task_id", task.id)
        .eq("date", selectedDateStr);
    } else {
      await supabase.from("completions").upsert(
        {
          user_id: userId,
          task_id: task.id,
          date: selectedDateStr,
          completed: true,
        },
        { onConflict: "task_id,date" },
      );
    }

    setTickingId(null);
  }

  async function toggleExercise(task: TaskWithStatus, exerciseIndex: number) {
    if (!userId || tickingId) return;

    const exercises = getWorkoutExercises(task);
    if (exercises.length === 0) return;

    const current = task.completedExercises || [];
    const nextCompletedExercises = current.includes(exerciseIndex)
      ? current.filter((index) => index !== exerciseIndex)
      : [...current, exerciseIndex].sort((a, b) => a - b);
    const completed = nextCompletedExercises.length === exercises.length;

    setTickingId(`${task.id}-${exerciseIndex}`);
    setTasks((items) =>
      items.map((item) =>
        item.id === task.id
          ? { ...item, completed, completedExercises: nextCompletedExercises }
          : item,
      ),
    );

    if (nextCompletedExercises.length === 0) {
      await supabase
        .from("completions")
        .delete()
        .eq("task_id", task.id)
        .eq("date", selectedDateStr);
    } else {
      await supabase.from("completions").upsert(
        {
          user_id: userId,
          task_id: task.id,
          date: selectedDateStr,
          completed,
          completed_exercises: nextCompletedExercises,
        },
        { onConflict: "task_id,date" },
      );
    }

    setTickingId(null);
  }

  const totals = SECTIONS.map((section) => {
    const sectionTasks = tasks.filter((task) => (task.category || "habit") === section.key);
    const done = sectionTasks.filter((task) => task.completed).length;
    return { ...section, total: sectionTasks.length, done };
  });

  return (
    <div className="mobile-page">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <h1>{format(selectedDate, "EEEE d MMMM")}</h1>
        </div>

        <div className="hero-rings" aria-label="Completion summary">
          {totals.map((item) => {
            const percent = item.total ? Math.round((item.done / item.total) * 100) : 0;
            return (
              <div key={item.key} className="mini-ring-wrap">
                <div
                  className={item.total > 0 && item.done === item.total ? "score-ring mini complete" : "score-ring mini"}
                  style={{
                    color: item.color,
                    background: `radial-gradient(var(--card) 55%, transparent 57%), conic-gradient(${item.color} ${percent}%, var(--card3) 0)`,
                  }}
                >
                  {percent}%
                </div>
                <span>{item.title}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="week-strip" aria-label="Select day">
        {weekDays.map((day) => {
          const selected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={selected ? "active" : ""}
              onClick={() => setSelectedDate(day)}
            >
              <span>{format(day, "EEE")}</span>
              <strong>{format(day, "d")}</strong>
            </button>
          );
        })}
      </section>

      {loading ? (
        <div className="center-state">
          <Loader2 className="spin" size={24} />
          <p>Loading your day...</p>
        </div>
      ) : (
        <div className="calendar-stack">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const sectionTasks = tasks.filter(
              (task) => (task.category || "habit") === section.key,
            );
            const done = sectionTasks.filter((task) => task.completed).length;

            return (
              <section key={section.key} className="tracker-calendar">
                <header>
                  <div>
                    <span style={{ background: `${section.color}18`, color: section.color }}>
                      <Icon size={17} />
                    </span>
                    <div>
                      <h2>{section.title}</h2>
                      <p>{done}/{sectionTasks.length} completed</p>
                    </div>
                  </div>
                </header>

                <div className="calendar-card">
                  {sectionTasks.length === 0 ? (
                    <a className="empty-link" href="/settings">
                      <Plus size={18} />
                      Add {section.title.toLowerCase()} in Task Manager
                    </a>
                  ) : (
                    sectionTasks.map((task) => {
                      const exercises = getWorkoutExercises(task);
                      const isWorkout = (task.category || "habit") === "workout";

                      if (isWorkout && exercises.length > 0) {
                        return (
                          <article
                            key={task.id}
                            className={task.completed ? "workout-session done" : "workout-session"}
                          >
                            <div className="workout-session-head">
                              <strong>{task.name}</strong>
                              <span>
                                {(task.completedExercises || []).length}/{exercises.length}
                              </span>
                            </div>
                            <div className="workout-exercise-list">
                              {exercises.map((exercise, index) => {
                                const exerciseDone = (task.completedExercises || []).includes(index);
                                return (
                                  <button
                                    key={`${task.id}-${index}`}
                                    type="button"
                                    className={exerciseDone ? "check-row done" : "check-row"}
                                    onClick={() => toggleExercise(task, index)}
                                    disabled={tickingId !== null}
                                  >
                                    <span
                                      className="check-box"
                                      style={{
                                        borderColor: exerciseDone ? task.color : "var(--card3)",
                                        background: exerciseDone ? task.color : "transparent",
                                      }}
                                    >
                                      {exerciseDone && <Check size={16} />}
                                    </span>
                                    <span>{exercise}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </article>
                        );
                      }

                      return (
                        <button
                          key={task.id}
                          type="button"
                          className={task.completed ? "check-row done" : "check-row"}
                          onClick={() => toggleTask(task)}
                          disabled={tickingId !== null}
                        >
                          <span
                            className="check-box"
                            style={{
                              borderColor: task.completed ? task.color : "var(--card3)",
                              background: task.completed ? task.color : "transparent",
                            }}
                          >
                            {task.completed && <Check size={16} />}
                          </span>
                          <span>{task.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
