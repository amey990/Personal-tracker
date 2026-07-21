"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import type { ElementType } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Check, Dumbbell, Loader2, Plus, Sparkles, Trash2, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskCategory, TaskWithStatus } from "@/lib/types";
import { getWorkoutExercises, isTaskActiveOnDate } from "@/lib/taskSchedule";
import WeightTracker from "@/components/WeightTracker";

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

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

const MOTIVATION_QUOTES = [
  "Small steps every day become the shape of your future.",
  "Discipline is choosing what you want most over what you want now.",
  "You do not need a perfect day. You need one honest win.",
  "Show up today. Momentum will meet you there.",
  "The work you repeat quietly becomes the progress people notice later.",
  "Consistency turns effort into identity.",
  "Make the next right choice, then the next one.",
  "Your future self is built in ordinary minutes.",
  "Progress is still progress when nobody claps for it.",
  "Keep promises to yourself. That is where confidence starts.",
  "A focused hour can change the tone of a whole day.",
  "Do the simple things well, especially when they feel boring.",
  "Energy follows action more often than action follows energy.",
  "You are allowed to move slowly. Just keep moving.",
  "Win the day in pieces.",
  "What you track, you can improve.",
  "One clean rep. One clean meal. One clean decision.",
  "The streak is not the goal. Becoming reliable is.",
  "Start before you feel ready; readiness often arrives late.",
  "Your standards are built by what you do on average days.",
];

type QuoteHistory = {
  date?: string;
  quote?: string;
  used?: string[];
};

function getSectionProgress(sectionTasks: TaskWithStatus[], sectionKey: TaskCategory) {
  if (sectionKey !== "workout") {
    return {
      done: sectionTasks.filter((task) => task.completed).length,
      total: sectionTasks.length,
    };
  }

  return sectionTasks.reduce(
    (progress, task) => {
      const exercises = getWorkoutExercises(task);

      if (exercises.length === 0) {
        return {
          done: progress.done + (task.completed ? 1 : 0),
          total: progress.total + 1,
        };
      }

      return {
        done: progress.done + (task.completedExercises || []).length,
        total: progress.total + exercises.length,
      };
    },
    { done: 0, total: 0 },
  );
}

function readTodos(storageKey: string) {
  if (!storageKey || typeof window === "undefined") return [];

  try {
    const storedTodos = window.localStorage.getItem(storageKey);
    return storedTodos ? (JSON.parse(storedTodos) as TodoItem[]) : [];
  } catch {
    return [];
  }
}

function getDailyQuote(storageKey: string, dateKey: string) {
  if (!storageKey || typeof window === "undefined") return "";

  try {
    const stored = window.localStorage.getItem(storageKey);
    const history = stored ? (JSON.parse(stored) as QuoteHistory) : {};

    if (history.date === dateKey && history.quote) {
      return history.quote;
    }

    const usedQuotes = Array.isArray(history.used) ? history.used : [];
    const availableQuotes = MOTIVATION_QUOTES.filter((quote) => !usedQuotes.includes(quote));
    const quotePool = availableQuotes.length > 0 ? availableQuotes : MOTIVATION_QUOTES;
    const nextQuote = quotePool[Math.floor(Math.random() * quotePool.length)];
    const nextUsed = availableQuotes.length > 0 ? [...usedQuotes, nextQuote] : [nextQuote];

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: dateKey,
        quote: nextQuote,
        used: nextUsed,
      }),
    );

    return nextQuote;
  } catch {
    return MOTIVATION_QUOTES[0];
  }
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [todoDraft, setTodoDraft] = useState("");
  const [, refreshTodos] = useReducer((revision: number) => revision + 1, 0);
  const [loading, setLoading] = useState(true);
  const [tickingId, setTickingId] = useState<string | null>(null);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const todoStorageKey = userId ? `tracker:todos:${userId}:${selectedDateStr}` : "";
  const quoteStorageKey = userId ? `tracker:quotes:${userId}` : "";
  const todos = readTodos(todoStorageKey);
  const dailyQuote = getDailyQuote(quoteStorageKey, selectedDateStr);
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

  function addTodo() {
    const text = todoDraft.trim();
    if (!text) return;

    updateTodos((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
      },
    ]);
    setTodoDraft("");
  }

  function updateTodos(updater: (items: TodoItem[]) => TodoItem[]) {
    if (!todoStorageKey) return;

    const nextTodos = updater(readTodos(todoStorageKey));
    window.localStorage.setItem(todoStorageKey, JSON.stringify(nextTodos));
    refreshTodos();
  }

  function toggleTodo(id: string) {
    updateTodos((items) =>
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  function deleteTodo(id: string) {
    updateTodos((items) => items.filter((item) => item.id !== id));
  }

  const totals = SECTIONS.map((section) => {
    const sectionTasks = tasks.filter((task) => (task.category || "habit") === section.key);
    return { ...section, ...getSectionProgress(sectionTasks, section.key) };
  });

  return (
    <div className="mobile-page">
      {dailyQuote && (
        <p className="daily-quote" aria-label="Daily motivation">
          &quot;{dailyQuote}&quot;
        </p>
      )}

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

      <WeightTracker />

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
            const { done, total } = getSectionProgress(sectionTasks, section.key);

            return (
              <section key={section.key} className="tracker-calendar">
                <header>
                  <div>
                    <span style={{ background: `${section.color}18`, color: section.color }}>
                      <Icon size={17} />
                    </span>
                    <div>
                      <h2>{section.title}</h2>
                      <p>{done}/{total} completed</p>
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

          <section className="tracker-calendar todo-calendar">
            <header>
              <div>
                <span style={{ background: "#2563eb18", color: "#2563eb" }}>
                  <Check size={17} />
                </span>
                <div>
                  <h2>Todo</h2>
                  <p>{todos.filter((todo) => todo.completed).length}/{todos.length} completed</p>
                </div>
              </div>
            </header>

            <div className="calendar-card todo-card">
              <div className="todo-input-row">
                <input
                  value={todoDraft}
                  onChange={(event) => setTodoDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addTodo();
                  }}
                  placeholder="Add today's todo"
                />
                <button type="button" aria-label="Add todo" onClick={addTodo}>
                  <Plus size={18} />
                </button>
              </div>

              {todos.length === 0 ? (
                <p className="todo-empty">No todos for this day.</p>
              ) : (
                <div className="todo-list">
                  {todos.map((todo) => (
                    <div key={todo.id} className={todo.completed ? "todo-row done" : "todo-row"}>
                      <button
                        type="button"
                        className="check-row"
                        onClick={() => toggleTodo(todo.id)}
                      >
                        <span className="check-box">
                          {todo.completed && <Check size={16} />}
                        </span>
                        <span>{todo.text}</span>
                      </button>
                      <button
                        type="button"
                        className="todo-delete"
                        aria-label="Delete todo"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
