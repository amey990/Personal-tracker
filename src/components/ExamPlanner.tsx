"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Exam, ExamStatus } from "@/lib/types";

type ExamPlannerProps = {
  userId: string;
};

export default function ExamPlanner({ userId }: ExamPlannerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examName, setExamName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadExams = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("exams")
      .select("id, user_id, name, scheduled_date, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setExams([]);
    } else {
      setExams((data || []) as Exam[]);
    }
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadExams();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadExams]);

  async function scheduleExam() {
    const name = examName.trim();
    if (!name || !scheduledDate || !userId || busyId) {
      if (!name || !scheduledDate) {
        setError("Enter an exam name and scheduled date.");
      }
      return;
    }

    setBusyId("new");
    setError("");
    const { data, error: insertError } = await supabase
      .from("exams")
      .insert({
        user_id: userId,
        name,
        scheduled_date: scheduledDate,
        status: "pending",
      })
      .select("id, user_id, name, scheduled_date, status, created_at, updated_at")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setExams((current) =>
        [...current, data as Exam].sort((a, b) =>
          a.scheduled_date.localeCompare(b.scheduled_date),
        ),
      );
      setExamName("");
      setScheduledDate("");
    }
    setBusyId(null);
  }

  function changeExam(id: string, field: "scheduled_date" | "status", value: string) {
    setExams((current) =>
      current.map((exam) =>
        exam.id === id
          ? {
              ...exam,
              [field]: value,
            }
          : exam,
      ),
    );
  }

  async function updateExam(exam: Exam) {
    if (!exam.scheduled_date || busyId) {
      if (!exam.scheduled_date) setError("Choose a scheduled date before saving.");
      return;
    }

    setBusyId(exam.id);
    setError("");
    const { error: updateError } = await supabase
      .from("exams")
      .update({
        scheduled_date: exam.scheduled_date,
        status: exam.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exam.id)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      await loadExams();
    } else {
      setExams((current) =>
        [...current].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
      );
    }
    setBusyId(null);
  }

  return (
    <>
      <section className="page-heading exam-heading">
        <div>
          <p className="eyebrow">Plan the next milestone</p>
          <h1>Exams</h1>
          <p>{exams.filter((exam) => exam.status === "pending").length} upcoming</p>
        </div>
        <span className="exam-heading-icon" aria-hidden="true">
          <CalendarDays size={24} />
        </span>
      </section>

      <section className="mobile-card exam-schedule-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">New exam</p>
            <h2 className="section-title">Schedule an exam</h2>
          </div>
          <span className="status-badge pending">Pending</span>
        </div>

        <div className="exam-form">
          <label>
            <span>Exam name</span>
            <input
              value={examName}
              onChange={(event) => {
                setExamName(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") void scheduleExam();
              }}
              placeholder="e.g. AWS Solutions Architect"
              disabled={busyId !== null}
            />
          </label>
          <label>
            <span>Scheduled date</span>
            <input
              type="date"
              value={scheduledDate}
              onChange={(event) => {
                setScheduledDate(event.target.value);
                setError("");
              }}
              disabled={busyId !== null}
            />
          </label>
          <button
            type="button"
            className="primary-button exam-schedule-button"
            onClick={() => void scheduleExam()}
            disabled={busyId !== null}
          >
            {busyId === "new" ? <Loader2 className="spin" size={18} /> : <CalendarDays size={18} />}
            Schedule
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="mobile-card mobile-stack exam-list-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">All exams</p>
            <h2 className="section-title">Exam plan</h2>
          </div>
          <span className="exam-count">{exams.length}</span>
        </div>

        {loading ? (
          <div className="center-state exam-loading">
            <Loader2 className="spin" size={24} />
            <p>Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="empty-state exam-empty">
            <CalendarDays size={30} />
            <h2>No exams scheduled</h2>
            <p>Your exam plan will appear here.</p>
          </div>
        ) : (
          <div className="exam-list">
            {exams.map((exam) => {
              const displayDate = exam.scheduled_date
                ? parseISO(exam.scheduled_date)
                : null;

              return (
              <article key={exam.id} className="exam-row">
                <div className="exam-row-summary">
                  <span className={`exam-date-tile ${exam.status}`}>
                    <strong>{displayDate ? format(displayDate, "dd") : "--"}</strong>
                    <small>{displayDate ? format(displayDate, "MMM") : "Date"}</small>
                  </span>
                  <div>
                    <strong>{exam.name}</strong>
                    <span>
                      {displayDate
                        ? format(displayDate, "EEEE, d MMMM yyyy")
                        : "Choose a scheduled date"}
                    </span>
                  </div>
                  <span className={`status-badge ${exam.status}`}>
                    {exam.status === "passed" && <Check size={13} />}
                    {exam.status === "passed" ? "Passed" : "Pending"}
                  </span>
                </div>

                <div className="exam-edit-row">
                  <label>
                    <span>Date</span>
                    <input
                      type="date"
                      value={exam.scheduled_date}
                      onChange={(event) =>
                        changeExam(exam.id, "scheduled_date", event.target.value)
                      }
                      disabled={busyId !== null}
                    />
                  </label>
                  <label>
                    <span>Status</span>
                    <select
                      value={exam.status}
                      onChange={(event) =>
                        changeExam(exam.id, "status", event.target.value as ExamStatus)
                      }
                      disabled={busyId !== null}
                    >
                      <option value="pending">Pending</option>
                      <option value="passed">Passed</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="small-button exam-update-button"
                    onClick={() => void updateExam(exam)}
                    disabled={busyId !== null}
                  >
                    {busyId === exam.id ? <Loader2 className="spin" size={16} /> : "Save changes"}
                  </button>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
