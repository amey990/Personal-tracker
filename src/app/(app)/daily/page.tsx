"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { addDays, differenceInCalendarDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { CalendarDays, Check, Dumbbell, Flame, Loader2, Plus, Sparkles, Trash2, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Exam, Task, TaskCategory, TaskWithStatus } from "@/lib/types";
import { getWorkoutExercises, isTaskActiveOnDate } from "@/lib/taskSchedule";
import WeightTracker from "@/components/WeightTracker";

type DashboardSectionKey = TaskCategory | "fatburn";

const SUMMARY_SECTIONS: {
  key: TaskCategory;
  title: string;
  color: string;
  icon: ElementType;
}[] = [
  { key: "habit", title: "Habits", color: "#7c3aed", icon: Sparkles },
  { key: "diet", title: "Diet", color: "#059669", icon: Utensils },
  { key: "workout", title: "Workout", color: "#dc2626", icon: Dumbbell },
];

const TRACKER_SECTIONS: {
  key: DashboardSectionKey;
  title: string;
  color: string;
  icon: ElementType;
}[] = [
  { key: "habit", title: "Habits", color: "#7c3aed", icon: Sparkles },
  { key: "diet", title: "Diet", color: "#059669", icon: Utensils },
  { key: "fatburn", title: "Daily Fatburn", color: "#f97316", icon: Flame },
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
  user_id?: string;
  date?: string;
  created_at?: string;
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

function getTasksForSection(tasks: TaskWithStatus[], sectionKey: DashboardSectionKey) {
  if (sectionKey === "fatburn") {
    return tasks.filter(
      (task) => (task.category || "habit") === "workout" && task.is_daily === true,
    );
  }

  if (sectionKey === "workout") {
    return tasks.filter(
      (task) => (task.category || "habit") === "workout" && task.is_daily !== true,
    );
  }

  return tasks.filter((task) => (task.category || "habit") === sectionKey);
}

function getSectionProgress(sectionTasks: TaskWithStatus[], sectionKey: DashboardSectionKey) {
  if (sectionKey !== "workout" && sectionKey !== "fatburn") {
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

function readLegacyTodos(storageKey: string) {
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

function UpcomingExamsStrip({
  exams,
  fromDate,
}: {
  exams: Exam[];
  fromDate: Date;
}) {
  return (
    <section className="upcoming-exams" aria-labelledby="upcoming-exams-title">
      <header>
        <div>
          <span className="upcoming-exams-icon">
            <CalendarDays size={18} />
          </span>
          <div>
            <p className="eyebrow">On the horizon</p>
            <h2 id="upcoming-exams-title">Upcoming exams</h2>
          </div>
        </div>
        <a href="/planner">View planner</a>
      </header>

      {exams.length === 0 ? (
        <a className="upcoming-exams-empty" href="/planner">
          No pending exams scheduled. Add one in Planner.
        </a>
      ) : (
        <div className="upcoming-exams-track">
          {exams.map((exam) => {
            const examDate = parseISO(exam.scheduled_date);
            const daysAway = differenceInCalendarDays(examDate, fromDate);
            const countdown =
              daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `${daysAway} days`;

            return (
              <article key={exam.id} className="upcoming-exam-chip">
                <span className="exam-date-tile pending">
                  <strong>{format(examDate, "dd")}</strong>
                  <small>{format(examDate, "MMM")}</small>
                </span>
                <div>
                  <strong>{exam.name}</strong>
                  <span>{countdown} · {format(examDate, "EEE, d MMM")}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoDraft, setTodoDraft] = useState("");
  const [todoBusyId, setTodoBusyId] = useState<string | null>(null);
  const [todoError, setTodoError] = useState("");
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickingId, setTickingId] = useState<string | null>(null);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const quoteStorageKey = userId ? `tracker:quotes:${userId}` : "";
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

    async function loadDashboard() {
      setLoading(true);
      setTodoError("");
      const [taskResult, completionResult, todoResult, examResult] = await Promise.all([
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
        supabase
          .from("todos")
          .select("id, user_id, date, text, completed, created_at")
          .eq("user_id", userId)
          .eq("date", selectedDateStr)
          .order("created_at"),
        supabase
          .from("exams")
          .select("id, user_id, name, scheduled_date, status, created_at, updated_at")
          .eq("user_id", userId)
          .eq("status", "pending")
          .gte("scheduled_date", selectedDateStr)
          .order("scheduled_date", { ascending: true })
          .limit(5),
      ]);

      const taskRows = taskResult.data;
      const completionRows = completionResult.data;
      setUpcomingExams(examResult.error ? [] : ((examResult.data || []) as Exam[]));

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

      if (todoResult.error) {
        setTodos([]);
        setTodoError(todoResult.error.message);
      } else {
        let savedTodos = (todoResult.data || []) as TodoItem[];
        const legacyStorageKey = `tracker:todos:${userId}:${selectedDateStr}`;
        const legacyTodos = readLegacyTodos(legacyStorageKey);

        if (legacyTodos.length > 0) {
          const { error: migrationError } = await supabase.from("todos").upsert(
            legacyTodos.map((todo) => ({
              id: todo.id,
              user_id: userId,
              date: selectedDateStr,
              text: todo.text,
              completed: todo.completed,
            })),
            { onConflict: "id" },
          );

          if (migrationError) {
            setTodoError(`Could not move saved todos: ${migrationError.message}`);
          } else {
            window.localStorage.removeItem(legacyStorageKey);
            const { data: migratedTodos } = await supabase
              .from("todos")
              .select("id, user_id, date, text, completed, created_at")
              .eq("user_id", userId)
              .eq("date", selectedDateStr)
              .order("created_at");
            savedTodos = (migratedTodos || []) as TodoItem[];
          }
        }

        setTodos(savedTodos);
      }
      setLoading(false);
    }

    void loadDashboard();
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

  async function addTodo() {
    const text = todoDraft.trim();
    if (!text || !userId || todoBusyId) return;

    setTodoBusyId("new");
    setTodoError("");
    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: userId,
        date: selectedDateStr,
        text,
        completed: false,
      })
      .select("id, user_id, date, text, completed, created_at")
      .single();

    if (error) {
      setTodoError(error.message);
    } else if (data) {
      setTodos((current) => [...current, data as TodoItem]);
      setTodoDraft("");
    }
    setTodoBusyId(null);
  }

  async function toggleTodo(todo: TodoItem) {
    if (!userId || todoBusyId) return;

    const completed = !todo.completed;
    setTodoBusyId(todo.id);
    setTodoError("");
    setTodos((current) =>
      current.map((item) => (item.id === todo.id ? { ...item, completed } : item)),
    );

    const { error } = await supabase
      .from("todos")
      .update({ completed, updated_at: new Date().toISOString() })
      .eq("id", todo.id)
      .eq("user_id", userId);

    if (error) {
      setTodos((current) =>
        current.map((item) =>
          item.id === todo.id ? { ...item, completed: todo.completed } : item,
        ),
      );
      setTodoError(error.message);
    }
    setTodoBusyId(null);
  }

  async function deleteTodo(todo: TodoItem) {
    if (!userId || todoBusyId) return;

    setTodoBusyId(todo.id);
    setTodoError("");
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", todo.id)
      .eq("user_id", userId);

    if (error) {
      setTodoError(error.message);
    } else {
      setTodos((current) => current.filter((item) => item.id !== todo.id));
    }
    setTodoBusyId(null);
  }

  function renderTrackerSection(sectionKey: DashboardSectionKey) {
    const section = TRACKER_SECTIONS.find((item) => item.key === sectionKey);
    if (!section) return null;

    const Icon = section.icon;
    const sectionTasks = getTasksForSection(tasks, section.key);
    const { done, total } = getSectionProgress(sectionTasks, section.key);

    return (
      <section
        key={section.key}
        className={`tracker-calendar tracker-section-${section.key}`}
      >
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
  }

  const totals = SUMMARY_SECTIONS.map((section) => {
    const sectionTasks = tasks.filter(
      (task) => (task.category || "habit") === section.key,
    );
    return { ...section, ...getSectionProgress(sectionTasks, section.key) };
  });

  return (
    <div className="mobile-page dashboard-page">
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
        <>
        <UpcomingExamsStrip exams={upcomingExams} fromDate={selectedDate} />
        <div className="calendar-stack">
          <div className="dashboard-column dashboard-column-primary">
            {renderTrackerSection("habit")}

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
                  onChange={(event) => {
                    setTodoDraft(event.target.value);
                    setTodoError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void addTodo();
                  }}
                  placeholder="Add today's todo"
                  disabled={todoBusyId !== null}
                />
                <button
                  type="button"
                  aria-label="Add todo"
                  onClick={() => void addTodo()}
                  disabled={todoBusyId !== null}
                >
                  {todoBusyId === "new" ? (
                    <Loader2 className="spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>

              {todoError && <p className="form-error todo-error">{todoError}</p>}

              {todos.length === 0 ? (
                <p className="todo-empty">No todos for this day.</p>
              ) : (
                <div className="todo-list">
                  {todos.map((todo) => (
                    <div key={todo.id} className={todo.completed ? "todo-row done" : "todo-row"}>
                      <button
                        type="button"
                        className="check-row"
                        onClick={() => void toggleTodo(todo)}
                        disabled={todoBusyId !== null}
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
                        onClick={() => void deleteTodo(todo)}
                        disabled={todoBusyId !== null}
                      >
                        {todoBusyId === todo.id ? (
                          <Loader2 className="spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </section>
          </div>

          <div className="dashboard-column dashboard-column-diet">
            {renderTrackerSection("diet")}
          </div>

          <div className="dashboard-column dashboard-column-activity">
            {renderTrackerSection("fatburn")}
            {renderTrackerSection("workout")}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
