"use client";

import { useState } from "react";
import { Pause, Pencil, Play, Trash2, X } from "lucide-react";
import { Task } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getTaskScheduleLabel } from "@/lib/taskSchedule";

const CATEGORY_LABELS = {
  habit: "Habit",
  diet: "Diet",
  workout: "Workout",
};

interface Props {
  task: Task;
  onDelete: (id: string) => void;
  onToggleActive: (task: Task) => void;
  onRename: () => void;
}

export default function TaskItem({
  task,
  onDelete,
  onToggleActive,
  onRename,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [confirming, setConfirming] = useState(false);
  const supabase = createClient();

  async function handleRename() {
    const nextName = name.trim();
    if (!nextName || nextName === task.name) {
      setEditing(false);
      setName(task.name);
      return;
    }

    await supabase.from("tasks").update({ name: nextName }).eq("id", task.id);
    setEditing(false);
    onRename();
  }

  return (
    <article className={`task-row ${task.active === false ? "paused" : ""}`}>
      <span className="task-dot" style={{ background: task.color }} />

      <div className="task-copy">
        {editing ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={handleRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleRename();
              if (event.key === "Escape") {
                setName(task.name);
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <>
            <strong>{task.name}</strong>
            <span>
              {CATEGORY_LABELS[task.category || "habit"]} -{" "}
              {getTaskScheduleLabel(task)}
              {task.active === false ? " - Paused" : ""}
            </span>
          </>
        )}
      </div>

      {confirming ? (
        <div className="task-confirm">
          <button type="button" onClick={() => onDelete(task.id)}>
            Delete
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="icon-actions">
          <button type="button" aria-label="Rename" onClick={() => setEditing(true)}>
            <Pencil size={17} />
          </button>
          <button
            type="button"
            aria-label={task.active !== false ? "Pause" : "Resume"}
            onClick={() => onToggleActive(task)}
          >
            {task.active !== false ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button type="button" aria-label="Delete" onClick={() => setConfirming(true)}>
            <Trash2 size={17} />
          </button>
        </div>
      )}
    </article>
  );
}
