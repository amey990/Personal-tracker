"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Course, DailyPlanItem } from "@/lib/types";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const COURSE_COLORS = [
  "#8b5cf6", "#6366f1", "#3b82f6", "#0ea5e9",
  "#10b981", "#f59e0b", "#ef4444", "#ec4899",
];
const PLATFORMS = ["Udemy", "YouTube", "Coursera", "Other"];

/* ═══════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════ */
interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div key={t.id}
          onClick={() => onDismiss(t.id)}
          style={{
            pointerEvents: "auto",
            padding: "12px 20px", borderRadius: 12,
            background: t.type === "success"
              ? "linear-gradient(135deg, #059669, #10b981)"
              : "linear-gradient(135deg, #dc2626, #ef4444)",
            color: "white", fontSize: 13, fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            animation: "slideIn .3s ease-out",
            maxWidth: 360,
          }}
        >
          <span style={{ fontSize: 16 }}>
            {t.type === "success" ? "✓" : "✕"}
          </span>
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */
const CheckIcon = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="3.5" strokeLinecap="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);
const PlusIcon = ({ size = 14, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const XIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/* ═══════════════════════════════════════════
   SHARED SUB‑COMPONENTS
   ═══════════════════════════════════════════ */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
      textTransform: "uppercase", color: "var(--text3)", marginBottom: 14,
    }}>
      {children}
    </p>
  );
}

function ProgBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{
      height: 4, background: "var(--card3)", borderRadius: 4,
      overflow: "hidden",
    }}>
      <div style={{
        height: 4, width: `${pct}%`, background: color,
        borderRadius: 4, transition: "width .7s ease",
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function PlannerPage() {
  const supabase = createClient();

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  const showToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [coursePlatform, setCoursePlatform] = useState("Udemy");
  const [courseTotalSections, setCourseTotalSections] = useState("");
  const [courseColor, setCourseColor] = useState(COURSE_COLORS[0]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editSections, setEditSections] = useState("");

  // Daily plans
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [planItems, setPlanItems] = useState<DailyPlanItem[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planCourseId, setPlanCourseId] = useState<string>("");
  const [planNotes, setPlanNotes] = useState("");

  // Weekly
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [weekItems, setWeekItems] = useState<DailyPlanItem[]>([]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  /* ── INIT ── */
  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (user) fetchPlanItems(user.id, dateStr);
  }, [dateStr, user]);

  useEffect(() => {
    if (user) fetchWeekItems(user.id);
  }, [weekStart, user]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);
    await fetchCourses(user.id);
    await fetchPlanItems(user.id, format(new Date(), "yyyy-MM-dd"));
    await fetchWeekItems(user.id);
    setLoading(false);
  }

  /* ── DATA FETCHING ── */
  async function fetchCourses(uid: string) {
    const { data, error } = await supabase
      .from("courses").select("*")
      .eq("user_id", uid).eq("active", true)
      .order("position");
    if (error) { showToast("Failed to load courses: " + error.message, "error"); return; }
    setCourses(data || []);
  }

  async function fetchPlanItems(uid: string, date: string) {
    const { data, error } = await supabase
      .from("daily_plan_items").select("*, course:courses(*)")
      .eq("user_id", uid).eq("date", date)
      .order("created_at");
    if (error) { showToast("Failed to load plan: " + error.message, "error"); return; }
    setPlanItems(data || []);
  }

  async function fetchWeekItems(uid: string) {
    const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const { data, error } = await supabase
      .from("daily_plan_items").select("*, course:courses(*)")
      .eq("user_id", uid)
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(wEnd, "yyyy-MM-dd"))
      .order("created_at");
    if (error) return;
    setWeekItems(data || []);
  }

  /* ── COURSE ACTIONS ── */
  async function addCourse() {
    if (!courseName.trim()) { showToast("Course name is required", "error"); return; }
    const { error } = await supabase.from("courses").insert({
      user_id: user.id,
      name: courseName.trim(),
      platform: coursePlatform,
      total_sections: +courseTotalSections || 0,
      completed_sections: 0,
      color: courseColor,
      position: courses.length + 1,
    });
    if (error) { showToast("Failed to add course: " + error.message, "error"); return; }
    showToast(`"${courseName.trim()}" added successfully`, "success");
    setCourseName(""); setCourseTotalSections(""); setShowCourseForm(false);
    await fetchCourses(user.id);
  }

  async function deleteCourse(id: string) {
    const name = courses.find(c => c.id === id)?.name || "Course";
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { showToast("Failed to delete: " + error.message, "error"); return; }
    setCourses(prev => prev.filter(c => c.id !== id));
    showToast(`"${name}" deleted`, "success");
  }

  async function updateCourseSections(course: Course, val: number) {
    const { error } = await supabase.from("courses")
      .update({ completed_sections: val }).eq("id", course.id);
    if (error) { showToast("Failed to update: " + error.message, "error"); return; }
    setCourses(prev => prev.map(c =>
      c.id === course.id ? { ...c, completed_sections: val } : c));
    setEditingCourse(null); setEditSections("");
    showToast(`"${course.name}" progress updated to ${val}/${course.total_sections}`, "success");
  }

  /* ── PLAN ITEM ACTIONS ── */
  async function addPlanItem() {
    if (!planTitle.trim()) { showToast("Task title is required", "error"); return; }
    const { data, error } = await supabase.from("daily_plan_items").insert({
      user_id: user.id,
      course_id: planCourseId || null,
      title: planTitle.trim(),
      date: dateStr,
      completed: false,
      notes: planNotes || null,
    }).select("*, course:courses(*)").single();
    if (error) { showToast("Failed to add task: " + error.message, "error"); return; }
    if (data) setPlanItems(prev => [...prev, data]);
    showToast(`Task added for ${isToday(selectedDate) ? "today" : format(selectedDate, "MMM d")}`, "success");
    setPlanTitle(""); setPlanCourseId(""); setPlanNotes(""); setShowPlanForm(false);
    fetchWeekItems(user.id);
  }

  async function togglePlanItem(item: DailyPlanItem) {
    const newCompleted = !item.completed;
    const { error } = await supabase.from("daily_plan_items")
      .update({ completed: newCompleted }).eq("id", item.id);
    if (error) { showToast("Failed to update: " + error.message, "error"); return; }
    setPlanItems(prev => prev.map(p =>
      p.id === item.id ? { ...p, completed: newCompleted } : p));

    // Auto-increment/decrement course completed_sections
    if (item.course_id) {
      const course = courses.find(c => c.id === item.course_id);
      if (course) {
        const newCount = newCompleted
          ? course.completed_sections + 1
          : Math.max(0, course.completed_sections - 1);
        await supabase.from("courses")
          .update({ completed_sections: newCount }).eq("id", course.id);
        setCourses(prev => prev.map(c =>
          c.id === course.id ? { ...c, completed_sections: newCount } : c));
      }
    }
    setWeekItems(prev => prev.map(p =>
      p.id === item.id ? { ...p, completed: newCompleted } : p));
    showToast(newCompleted ? "Task completed! ✓" : "Task unchecked", "success");
  }

  async function deletePlanItem(id: string) {
    const { error } = await supabase.from("daily_plan_items").delete().eq("id", id);
    if (error) { showToast("Failed to delete: " + error.message, "error"); return; }
    setPlanItems(prev => prev.filter(p => p.id !== id));
    setWeekItems(prev => prev.filter(p => p.id !== id));
    showToast("Task removed", "success");
  }

  /* ── COMPUTED ── */
  const donePlan = planItems.filter(p => p.completed).length;
  const totalPlan = planItems.length;
  const doneWeek = weekItems.filter(i => i.completed).length;
  const totalWeek = weekItems.length;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  /* ── ACCENT ── */
  const accentIndigo = "linear-gradient(90deg, #6366f1, #818cf8)";
  const accentTeal = "linear-gradient(90deg, #0d9488, #2dd4bf)";
  const accentSlate = "linear-gradient(90deg, #475569, #94a3b8)";

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{
          height: 200, borderRadius: 20, background: "var(--card)",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ══ TOASTS ══ */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ══ HEADER ══ */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 4 }}>
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 style={{
            fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px",
            color: "var(--text)", lineHeight: 1.1,
          }}>
            Study Planner
          </h1>
          <p style={{ fontSize: 14, color: "var(--text2)", marginTop: 6 }}>
            Plan your learning, track your progress
          </p>
        </div>
        {totalWeek > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 36, fontWeight: 900, letterSpacing: "-2px",
              background: doneWeek === totalWeek
                ? "linear-gradient(135deg,#059669,#34d399)"
                : "linear-gradient(135deg,#6366f1,#a5b4fc)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {doneWeek}/{totalWeek}
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              this week
            </p>
          </div>
        )}
      </div>

      {/* ══ COURSES ══ */}
      <div style={{
        background: "var(--card)", borderRadius: 20,
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <div style={{ height: 4, background: accentIndigo }} />
        <div style={{ padding: "20px 22px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 16,
          }}>
            <Label>My Courses</Label>
            <button onClick={() => setShowCourseForm(!showCourseForm)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 10, border: "none",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: showCourseForm ? "var(--card2)" : "#6366f1",
              color: showCourseForm ? "var(--text2)" : "white",
              transition: "all .2s",
            }}>
              {showCourseForm
                ? <><XIcon size={11} /> Cancel</>
                : <><PlusIcon size={11} /> Add course</>}
            </button>
          </div>

          {/* Add course form */}
          {showCourseForm && (
            <div style={{
              marginBottom: 18, padding: 18, borderRadius: 16,
              background: "var(--card2)", border: "1px solid var(--border)",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
            }}>
              <input
                placeholder="Course name" value={courseName}
                onChange={e => setCourseName(e.target.value)}
                style={{ gridColumn: "1/3" }}
              />
              <select value={coursePlatform}
                onChange={e => setCoursePlatform(e.target.value)}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                type="number" placeholder="Total sections/lectures"
                value={courseTotalSections}
                onChange={e => setCourseTotalSections(e.target.value)}
              />
              <div style={{
                gridColumn: "1/3", display: "flex",
                alignItems: "center", gap: 8, padding: "0 4px",
              }}>
                {COURSE_COLORS.map(c => (
                  <button key={c} onClick={() => setCourseColor(c)} style={{
                    width: 22, height: 22, borderRadius: "50%", background: c,
                    border: "none", cursor: "pointer", flexShrink: 0,
                    outline: courseColor === c ? `3px solid ${c}` : "none",
                    outlineOffset: 2, transition: "transform .15s",
                    transform: courseColor === c ? "scale(1.2)" : "scale(1)",
                  }} />
                ))}
              </div>
              <button onClick={addCourse} style={{
                gridColumn: "1/3", padding: "10px 0", borderRadius: 12,
                border: "none", cursor: "pointer", background: "#6366f1",
                color: "white", fontSize: 13, fontWeight: 600,
              }}>
                Save course
              </button>
            </div>
          )}

          {/* Course cards */}
          {courses.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text3)", padding: "8px 0" }}>
              No courses yet — click &quot;Add course&quot; to start tracking
            </p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}>
              {courses.map(course => {
                const pct = course.total_sections > 0
                  ? Math.min(Math.round((course.completed_sections / course.total_sections) * 100), 100)
                  : 0;
                const isEdit = editingCourse?.id === course.id;
                return (
                  <div key={course.id} style={{
                    padding: "16px 18px", borderRadius: 16,
                    background: "var(--card2)", border: "1px solid var(--border)",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", left: 0, top: 14, bottom: 14,
                      width: 3, borderRadius: "0 4px 4px 0", background: course.color,
                    }} />
                    <div style={{ paddingLeft: 10 }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", marginBottom: 8,
                      }}>
                        <div>
                          <p style={{
                            fontSize: 14, fontWeight: 700,
                            color: "var(--text)", lineHeight: 1.3,
                          }}>
                            {course.name}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                            {course.platform}
                          </p>
                        </div>
                        <button onClick={() => deleteCourse(course.id)} style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--text3)", padding: 2, display: "flex",
                        }}>
                          <XIcon size={12} />
                        </button>
                      </div>

                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: course.color, letterSpacing: "-1px" }}>
                          {pct}%
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>
                          {course.completed_sections}/{course.total_sections} sections
                        </span>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <ProgBar pct={pct} color={course.color} />
                      </div>

                      {isEdit ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input type="number" placeholder="Completed" value={editSections}
                            onChange={e => setEditSections(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && updateCourseSections(course, +editSections)}
                            autoFocus style={{ flex: 1, fontSize: 12, padding: "7px 10px" }}
                          />
                          <button onClick={() => updateCourseSections(course, +editSections)} style={{
                            padding: "7px 12px", borderRadius: 8, border: "none",
                            cursor: "pointer", background: course.color,
                            color: "white", fontSize: 12, fontWeight: 600,
                          }}>✓</button>
                          <button onClick={() => setEditingCourse(null)} style={{
                            padding: "7px 10px", borderRadius: 8, border: "none",
                            cursor: "pointer", background: "var(--card3)",
                            color: "var(--text3)", fontSize: 12,
                          }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => {
                          setEditingCourse(course);
                          setEditSections(String(course.completed_sections));
                        }} style={{
                          background: "none", border: `1px solid ${course.color}33`,
                          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                          fontSize: 11, fontWeight: 600, color: course.color,
                          transition: "all .2s", width: "100%",
                        }}>
                          Update progress →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ DAILY PLAN ══ */}
      <div style={{
        background: "var(--card)", borderRadius: 20,
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <div style={{ height: 4, background: accentTeal }} />
        <div style={{ padding: "20px 22px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 20,
          }}>
            <Label>
              Daily Plan — {isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d")}
            </Label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setSelectedDate(d => subDays(d, 1))} style={{
                width: 32, height: 32, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--card2)", border: "1px solid var(--border)",
                cursor: "pointer", color: "var(--text2)",
              }}>
                <ChevronLeft />
              </button>
              <button onClick={() => setSelectedDate(new Date())} style={{
                padding: "7px 16px", borderRadius: 10, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: isToday(selectedDate) ? "#0d9488" : "var(--card2)",
                color: isToday(selectedDate) ? "white" : "var(--text2)",
                transition: "all .2s",
              }}>
                Today
              </button>
              <button onClick={() => setSelectedDate(d => addDays(d, 1))} style={{
                width: 32, height: 32, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--card2)", border: "1px solid var(--border)",
                cursor: "pointer", color: "var(--text2)",
              }}>
                <ChevronRight />
              </button>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px",
                borderRadius: 20, marginLeft: 4,
                background: "rgba(13,148,136,0.12)", color: "#0d9488",
                border: "1px solid rgba(13,148,136,0.2)",
              }}>
                {donePlan}/{totalPlan}
              </span>
            </div>
          </div>

          <button onClick={() => setShowPlanForm(!showPlanForm)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 12, border: "1px dashed var(--border)",
            cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: "transparent", color: "var(--text3)",
            width: "100%", marginBottom: showPlanForm ? 12 : 16,
            transition: "all .2s",
          }}>
            <PlusIcon size={14} color="var(--text3)" /> Add a task for {isToday(selectedDate) ? "today" : format(selectedDate, "MMM d")}...
          </button>

          {showPlanForm && (
            <div style={{
              marginBottom: 16, padding: 16, borderRadius: 14,
              background: "var(--card2)", border: "1px solid var(--border)",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="What will you study?"
                  value={planTitle} onChange={e => setPlanTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addPlanItem()}
                  style={{ flex: 1 }} autoFocus
                />
                <select value={planCourseId}
                  onChange={e => setPlanCourseId(e.target.value)}
                  style={{ width: 180 }}>
                  <option value="">General (no course)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <input placeholder="Notes (optional)"
                value={planNotes} onChange={e => setPlanNotes(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPlanItem()}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addPlanItem} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                  cursor: "pointer", background: "#0d9488", color: "white",
                  fontSize: 13, fontWeight: 600,
                }}>
                  Add task
                </button>
                <button onClick={() => { setShowPlanForm(false); setPlanTitle(""); setPlanNotes(""); }} style={{
                  padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)",
                  cursor: "pointer", background: "var(--card3)", color: "var(--text2)",
                  fontSize: 13, fontWeight: 500,
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Plan items list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {planItems.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "36px 0", borderRadius: 14,
                background: "var(--card2)", border: "1px solid var(--border)",
              }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📚</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>
                  No tasks planned for {isToday(selectedDate) ? "today" : format(selectedDate, "MMM d")}
                </p>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                  Click the button above to add study tasks
                </p>
              </div>
            ) : (
              planItems.map(item => {
                const courseData = item.course as Course | undefined;
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 14,
                    background: item.completed ? "transparent" : "var(--card2)",
                    border: `1px solid ${item.completed ? "transparent" : "var(--border)"}`,
                    transition: "all .25s",
                  }}>
                    <button onClick={() => togglePlanItem(item)} style={{
                      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: item.completed ? "none" : "2px solid var(--card3)",
                      background: item.completed ? (courseData?.color || "#0d9488") : "transparent",
                      boxShadow: item.completed ? `0 0 10px ${courseData?.color || "#0d9488"}55` : "none",
                      cursor: "pointer", transition: "all .25s",
                    }}>
                      {item.completed && <CheckIcon size={10} />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 13, fontWeight: 600,
                          color: item.completed ? "var(--text3)" : "var(--text)",
                          textDecoration: item.completed ? "line-through" : "none",
                        }}>
                          {item.title}
                        </span>
                        {courseData && (
                          <span style={{
                            fontSize: 10, padding: "2px 8px", borderRadius: 100,
                            background: `${courseData.color}18`, color: courseData.color,
                            border: `1px solid ${courseData.color}30`, fontWeight: 600,
                          }}>
                            {courseData.name}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 3, fontStyle: "italic" }}>
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <button onClick={() => deletePlanItem(item.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text3)", padding: 4, display: "flex",
                      opacity: 0.5, transition: "opacity .2s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {totalPlan > 0 && donePlan === totalPlan && (
            <div style={{
              marginTop: 14, textAlign: "center", padding: "12px 0",
              borderRadius: 12, background: "rgba(13,148,136,0.08)",
              border: "1px solid rgba(13,148,136,0.15)",
              fontSize: 13, fontWeight: 600, color: "#0d9488",
            }}>
              All tasks completed! 🎯
            </div>
          )}
        </div>
      </div>

      {/* ══ WEEKLY OVERVIEW ══ */}
      <div style={{
        background: "var(--card)", borderRadius: 20,
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <div style={{ height: 4, background: accentSlate }} />
        <div style={{ padding: "20px 22px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 20,
          }}>
            <Label>
              Weekly Overview — {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </Label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setWeekStart(w => subWeeks(w, 1))} style={{
                width: 32, height: 32, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--card2)", border: "1px solid var(--border)",
                cursor: "pointer", color: "var(--text2)",
              }}>
                <ChevronLeft />
              </button>
              <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} style={{
                padding: "7px 16px", borderRadius: 10, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))
                  ? "#475569" : "var(--card2)",
                color: isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))
                  ? "white" : "var(--text2)",
                transition: "all .2s",
              }}>
                This week
              </button>
              <button onClick={() => setWeekStart(w => addWeeks(w, 1))} style={{
                width: 32, height: 32, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--card2)", border: "1px solid var(--border)",
                cursor: "pointer", color: "var(--text2)",
              }}>
                <ChevronRight />
              </button>
              {totalWeek > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px",
                  borderRadius: 20, marginLeft: 4,
                  background: "rgba(71,85,105,0.12)", color: "#94a3b8",
                  border: "1px solid rgba(71,85,105,0.2)",
                }}>
                  {doneWeek}/{totalWeek} done
                </span>
              )}
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8,
          }}>
            {weekDays.map(day => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayItems = weekItems.filter(i => i.date === dayStr);
              const dayDone = dayItems.filter(i => i.completed).length;
              const dayIsToday = isToday(day);
              const selected = isSameDay(day, selectedDate);

              return (
                <div key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    padding: "12px 10px", borderRadius: 14,
                    background: selected ? "rgba(99,102,241,0.08)"
                      : dayIsToday ? "rgba(13,148,136,0.05)"
                      : "var(--card2)",
                    border: `1px solid ${
                      selected ? "rgba(99,102,241,0.25)"
                        : dayIsToday ? "rgba(13,148,136,0.15)"
                        : "var(--border)"
                    }`,
                    cursor: "pointer", transition: "all .2s",
                    minHeight: 120,
                  }}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 10,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: dayIsToday ? "#0d9488" : "var(--text3)",
                      textTransform: "uppercase",
                    }}>
                      {format(day, "EEE")}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: dayIsToday ? 800 : 600,
                      color: dayIsToday ? "#0d9488" : "var(--text2)",
                      width: 28, height: 28, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: dayIsToday ? "rgba(13,148,136,0.12)" : "transparent",
                    }}>
                      {format(day, "d")}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayItems.length === 0 ? (
                      <p style={{ fontSize: 10, color: "var(--text3)", textAlign: "center", padding: "8px 0" }}>
                        —
                      </p>
                    ) : (
                      dayItems.map(item => {
                        const cd = item.course as Course | undefined;
                        return (
                          <div key={item.id} style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "4px 6px", borderRadius: 6,
                            background: item.completed
                              ? `${cd?.color || "#0d9488"}10`
                              : "var(--card3)",
                          }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                              background: item.completed ? (cd?.color || "#0d9488") : "var(--text3)",
                              opacity: item.completed ? 1 : 0.4,
                            }} />
                            <span style={{
                              fontSize: 10, fontWeight: 500,
                              color: item.completed ? "var(--text3)" : "var(--text2)",
                              textDecoration: item.completed ? "line-through" : "none",
                              overflow: "hidden", textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              {item.title}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {dayItems.length > 0 && (
                    <div style={{
                      marginTop: 8, textAlign: "center",
                      fontSize: 10, fontWeight: 600,
                      color: dayDone === dayItems.length ? "#10b981" : "var(--text3)",
                    }}>
                      {dayDone === dayItems.length ? "✓ Done" : `${dayDone}/${dayItems.length}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
