"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DietDayType, TaskCategory } from "@/lib/types";
import { WEEKDAYS } from "@/lib/taskSchedule";

const CATEGORIES: { label: string; value: TaskCategory; color: string }[] = [
  { label: "Habit", value: "habit", color: "#7c3aed" },
  { label: "Diet", value: "diet", color: "#059669" },
  { label: "Workout", value: "workout", color: "#dc2626" },
];

const COLORS = [
  "#7c3aed",
  "#059669",
  "#0ea5e9",
  "#d97706",
  "#dc2626",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
];

interface Props {
  onSave: () => void;
  onCancel: () => void;
}

export default function TaskForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TaskCategory>("habit");
  const [type, setType] = useState<"recurring" | "one_off">("recurring");
  const [targetDate, setTargetDate] = useState("");
  const [dietDayType, setDietDayType] = useState<DietDayType>("training");
  const [scheduledWeekday, setScheduledWeekday] = useState(1);
  const [workoutEveryDay, setWorkoutEveryDay] = useState(false);
  const [exercises, setExercises] = useState([""]);
  const [color, setColor] = useState(CATEGORIES[0].color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  function selectCategory(next: TaskCategory) {
    setCategory(next);
    setColor(CATEGORIES.find((item) => item.value === next)?.color || color);
    if (next === "workout") {
      setType("recurring");
      setTargetDate("");
    }
    if (next === "diet") {
      setType("recurring");
      setTargetDate("");
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Task name is required");
      return;
    }

    if (category !== "workout" && type === "one_off" && !targetDate) {
      setError("Pick a date for one-time tasks");
      return;
    }

    const workoutExercises = exercises
      .map((exercise) => exercise.trim())
      .filter(Boolean);

    if (category === "workout" && workoutExercises.length === 0) {
      setError("Add at least one exercise");
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError("Please sign in again");
      return;
    }

    const { error: dbError } = await supabase.from("tasks").insert({
      user_id: user.id,
      name: name.trim(),
      category,
      type: category === "workout" ? "recurring" : type,
      target_date: category !== "workout" && type === "one_off" ? targetDate : null,
      scheduled_weekday: category === "workout" && !workoutEveryDay ? scheduledWeekday : null,
      is_daily: category === "workout" ? workoutEveryDay : false,
      diet_day_type: category === "diet" && type === "recurring" ? dietDayType : null,
      exercises: category === "workout" ? workoutExercises : [],
      color,
      position: Date.now(),
      active: true,
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    onSave();
  }

  return (
    <section className="mobile-card mobile-stack">
      <div>
        <p className="eyebrow">New Task</p>
        <h2 className="section-title">Add something to track</h2>
      </div>

      <label className="field-label" htmlFor="task-name">
        Task name
      </label>
      <input
        id="task-name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError("");
        }}
        placeholder="Morning walk, no sugar, gym..."
        autoFocus
      />

      <div>
        <p className="field-label">Category</p>
        <div className="segmented">
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={category === item.value ? "active" : ""}
              onClick={() => selectCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {category === "workout" ? (
        <>
          <div>
            <p className="field-label">Workout day</p>
            <div className="segmented workout-days">
              <button
                type="button"
                className={workoutEveryDay ? "active" : ""}
                onClick={() => setWorkoutEveryDay(true)}
              >
                Every day
              </button>
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={!workoutEveryDay && scheduledWeekday === day.value ? "active" : ""}
                  onClick={() => {
                    setWorkoutEveryDay(false);
                    setScheduledWeekday(day.value);
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          <div className="exercise-fields">
            <div className="section-head">
              <p className="field-label">Exercises</p>
              <button
                type="button"
                className="small-button exercise-add"
                onClick={() => setExercises((current) => [...current, ""])}
              >
                Add
              </button>
            </div>
            {exercises.map((exercise, index) => (
              <div key={index} className="exercise-input-row">
                <input
                  value={exercise}
                  onChange={(event) =>
                    setExercises((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  placeholder={`Exercise ${index + 1}`}
                />
                {exercises.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove exercise"
                    onClick={() =>
                      setExercises((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : category === "diet" ? (
        <>
          <div>
            <p className="field-label">Diet day</p>
            <div className="segmented two">
              <button
                type="button"
                className={dietDayType === "training" ? "active" : ""}
                onClick={() => setDietDayType("training")}
              >
                Training day
              </button>
              <button
                type="button"
                className={dietDayType === "rest" ? "active" : ""}
                onClick={() => setDietDayType("rest")}
              >
                Rest day
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="field-label">Schedule</p>
            <div className="segmented">
              <button
                type="button"
                className={type === "recurring" ? "active" : ""}
                onClick={() => setType("recurring")}
              >
                Every day
              </button>
              <button
                type="button"
                className={type === "one_off" ? "active" : ""}
                onClick={() => setType("one_off")}
              >
                One time
              </button>
            </div>
          </div>

          {type === "one_off" && (
            <>
              <label className="field-label" htmlFor="target-date">
                Date
              </label>
              <input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </>
          )}
        </>
      )}

      <div>
        <p className="field-label">Color</p>
        <div className="color-grid">
          {COLORS.map((item) => (
            <button
              key={item}
              type="button"
              aria-label={`Use ${item}`}
              className={color === item ? "selected" : ""}
              onClick={() => setColor(item)}
              style={{ background: item }}
            />
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={handleSave}
          disabled={saving}
          style={{ background: color }}
        >
          {saving ? "Saving..." : "Save task"}
        </button>
      </div>
    </section>
  );
}
