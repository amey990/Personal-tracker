"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Scale, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type WeightEntry = {
  id: string;
  user_id: string;
  weight_kg: number;
  date: string;
  created_at: string;
  updated_at: string;
};

function formatWeight(weight: number) {
  return Number(weight).toFixed(1).replace(/\.0$/, "");
}

export default function WeightTracker() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [weight, setWeight] = useState("");
  const [entryDate, setEntryDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadEntries = useCallback(
    async (currentUserId: string) => {
      const { data, error: loadError } = await supabase
        .from("weight_entries")
        .select("id, user_id, weight_kg, date, created_at, updated_at")
        .eq("user_id", currentUserId)
        .order("date", { ascending: false });

      if (loadError) {
        setError(loadError.message);
      } else {
        setEntries((data || []) as WeightEntry[]);
      }
      setLoading(false);
    },
    [supabase],
  );

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (!user) {
        setError("Please sign in again to load your weight history.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      void loadEntries(user.id);
    });

    return () => {
      active = false;
    };
  }, [loadEntries, supabase]);

  async function saveWeight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const weightValue = Number(weight);

    if (!userId) {
      setError("Please sign in again before saving.");
      return;
    }
    if (!entryDate) {
      setError("Select a date.");
      return;
    }
    if (!Number.isFinite(weightValue) || weightValue <= 0 || weightValue > 1000) {
      setError("Enter a valid weight between 0 and 1000 kg.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: saveError } = await supabase.from("weight_entries").upsert(
      {
        user_id: userId,
        weight_kg: weightValue,
        date: entryDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" },
    );

    if (saveError) {
      setError(saveError.message);
    } else {
      setWeight("");
      await loadEntries(userId);
    }
    setSaving(false);
  }

  async function deleteEntry(entry: WeightEntry) {
    if (!userId || deletingId) return;

    setDeletingId(entry.id);
    setError("");
    const { error: deleteError } = await supabase
      .from("weight_entries")
      .delete()
      .eq("id", entry.id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    }
    setDeletingId(null);
  }

  return (
    <section className="weight-card mobile-card">
      <header className="weight-card-header">
        <span className="weight-card-icon">
          <Scale size={20} />
        </span>
        <div>
          <h2>Weight tracker</h2>
          <p>Log your weight by date</p>
        </div>
        {entries[0] && (
          <div className="latest-weight">
            <span>Latest</span>
            <strong>{formatWeight(entries[0].weight_kg)} kg</strong>
          </div>
        )}
      </header>

      <form className="weight-form" onSubmit={saveWeight}>
        <div>
          <label className="field-label" htmlFor="weight-kg">
            Weight
          </label>
          <div className="weight-input-shell">
            <input
              id="weight-kg"
              type="number"
              inputMode="decimal"
              min="0.1"
              max="1000"
              step="0.1"
              value={weight}
              onChange={(event) => {
                setWeight(event.target.value);
                setError("");
              }}
              placeholder="Enter weight"
              required
            />
            <span>kg</span>
          </div>
        </div>

        <div className="weight-date-field">
          <label className="field-label" htmlFor="weight-date">
            Date
          </label>
          <input
            id="weight-date"
            type="date"
            value={entryDate}
            onChange={(event) => {
              setEntryDate(event.target.value);
              setError("");
            }}
            required
          />
        </div>

        <button className="primary-button weight-save-button" type="submit" disabled={saving || loading}>
          {saving ? (
            <>
              <Loader2 className="spin" size={17} />
              Saving...
            </>
          ) : (
            "Save weight"
          )}
        </button>
      </form>

      {error && <p className="form-error weight-error">{error}</p>}

      <div className="weight-history">
        <div className="weight-history-heading">
          <h3>Saved entries</h3>
          <span>{entries.length}</span>
        </div>

        {loading ? (
          <div className="weight-empty">
            <Loader2 className="spin" size={20} />
            <span>Loading weight history...</span>
          </div>
        ) : entries.length === 0 ? (
          <p className="weight-empty">No weight entries yet.</p>
        ) : (
          <div className="weight-entry-list">
            {entries.map((entry) => (
              <div className="weight-entry-row" key={entry.id}>
                <time dateTime={entry.date}>{format(parseISO(entry.date), "dd-MM-yyyy")}</time>
                <strong>{formatWeight(entry.weight_kg)} kg</strong>
                <button
                  type="button"
                  aria-label={`Delete weight for ${format(parseISO(entry.date), "dd-MM-yyyy")}`}
                  onClick={() => deleteEntry(entry)}
                  disabled={deletingId !== null}
                >
                  {deletingId === entry.id ? (
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
  );
}
