"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COLORS = [
  { label: "Violet", value: "#8b5cf6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Sky", value: "#0ea5e9" },
  { label: "Orange", value: "#f97316" },
  { label: "Pink", value: "#ec4899" },
  { label: "Teal", value: "#14b8a6" },
];

interface Props {
  onSave: () => void;
  onCancel: () => void;
}

export default function TaskForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"recurring" | "one_off">("recurring");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSave() {
    if (!name.trim()) {
      setError("Task name is required");
      return;
    }
    if (type === "one_off" && !targetDate) {
      setError("Please pick a date");
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: dbError } = await supabase.from("tasks").insert({
      user_id: user.id,
      name: name.trim(),
      type,
      target_date: type === "one_off" ? targetDate : null,
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

  const label = (text: string) => (
    <p
      style={{
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--text3)",
        marginBottom: "8px",
      }}
    >
      {text}
    </p>
  );

  return (
    <div
      style={{
        borderRadius: "16px",
        padding: "28px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
        New task
      </h2>

      {/* Name */}
      <div>
        {label("Name")}
        <input
          type="text"
          placeholder="e.g. Gym, Read, Meditate…"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          autoFocus
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: "10px",
            background: "var(--card2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Frequency */}
      <div>
        {label("Frequency")}
        <div style={{ display: "flex", gap: "10px" }}>
          {(["recurring", "one_off"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .2s",
                border: "1px solid",
                background: type === t ? "#7c3aed" : "var(--card2)",
                borderColor: type === t ? "#7c3aed" : "var(--border)",
                color: type === t ? "#fff" : "var(--text2)",
              }}
            >
              {t === "recurring" ? "🔁 Every day" : "📅 One-off"}
            </button>
          ))}
        </div>
      </div>

      {/* Date picker */}
      {type === "one_off" && (
        <div>
          {label("Date")}
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "10px",
              background: "var(--card2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Color picker */}
      <div>
        {label("Color")}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              title={c.label}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: c.value,
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                transition: "transform .15s, box-shadow .15s",
                transform: color === c.value ? "scale(1.2)" : "scale(1)",
                boxShadow:
                  color === c.value
                    ? `0 0 0 2px var(--card), 0 0 0 4px ${c.value}`
                    : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#ef444415",
            border: "1px solid #ef444430",
            color: "#ef4444",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "11px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            border: "1px solid var(--border)",
            background: "var(--card2)",
            color: "var(--text2)",
            transition: "all .2s",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1,
            padding: "11px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            border: "none",
            background: color,
            color: "#fff",
            opacity: saving ? 0.6 : 1,
            transition: "opacity .2s",
          }}
        >
          {saving ? "Saving…" : "Save task"}
        </button>
      </div>
    </div>
  );
}
