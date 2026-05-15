"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskCategory } from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";

const FILTERS: { label: string; value: TaskCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Habits", value: "habit" },
  { label: "Diet", value: "diet" },
  { label: "Workout", value: "workout" },
];

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<TaskCategory | "all">("all");

  const fetchTasks = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("position");

    setTasks(
      ((data || []) as Task[]).map((task) => ({
        ...task,
        category: task.category || "habit",
      })),
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTasks();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTasks]);

  async function handleDelete(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  async function handleToggleActive(task: Task) {
    const updated = { ...task, active: !task.active };
    await supabase.from("tasks").update({ active: updated.active }).eq("id", task.id);
    setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
  }

  const visibleTasks =
    filter === "all" ? tasks : tasks.filter((task) => (task.category || "habit") === filter);

  return (
    <div className="mobile-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Task Manager</p>
          <h1>Build your checklists</h1>
          <p>Everything added here appears on the dashboard calendar.</p>
        </div>
        <button type="button" className="fab-button" onClick={() => setShowForm((open) => !open)}>
          <Plus size={22} />
        </button>
      </section>

      {showForm && (
        <TaskForm
          onSave={() => {
            setShowForm(false);
            fetchTasks();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <section className="segmented wide">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={filter === item.value ? "active" : ""}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="center-state">
          <Loader2 className="spin" size={24} />
          <p>Loading tasks...</p>
        </div>
      ) : visibleTasks.length === 0 ? (
        <section className="center-state mobile-card">
          <ClipboardList size={32} />
          <h2>No tasks here yet</h2>
          <p>Tap the plus button to add your first habit, diet item, or workout.</p>
        </section>
      ) : (
        <section className="task-list">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onRename={fetchTasks}
            />
          ))}
        </section>
      )}
    </div>
  );
}
