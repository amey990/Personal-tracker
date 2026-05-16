"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { BookOpen, Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Course, DailyPlanItem } from "@/lib/types";

const COURSE_COLORS = ["#7c3aed", "#059669", "#0ea5e9", "#d97706", "#dc2626", "#ec4899"];

export default function PlannerPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [courses, setCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<DailyPlanItem[]>([]);
  const [courseName, setCourseName] = useState("");
  const [courseSections, setCourseSections] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCourse, setTaskCourse] = useState("");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState("");

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
    });
  }, [supabase]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: courseRows }, { data: itemRows }] = await Promise.all([
      supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .order("position"),
      supabase
        .from("daily_plan_items")
        .select("*, course:courses(*)")
        .eq("user_id", userId)
        .eq("date", selectedDateStr)
        .order("created_at"),
    ]);

    setCourses((courseRows || []) as Course[]);
    setItems((itemRows || []) as DailyPlanItem[]);
    setLoading(false);
  }, [selectedDateStr, supabase, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function addCourse() {
    if (!courseName.trim()) return;
    const color = COURSE_COLORS[courses.length % COURSE_COLORS.length];
    await supabase.from("courses").insert({
      user_id: userId,
      name: courseName.trim(),
      platform: "",
      total_sections: Number(courseSections) || 0,
      completed_sections: 0,
      color,
      position: courses.length + 1,
      active: true,
    });
    setCourseName("");
    setCourseSections("");
    setShowCourseForm(false);
    loadData();
  }

  async function addPlanItem() {
    if (!taskTitle.trim()) return;
    const { data } = await supabase
      .from("daily_plan_items")
      .insert({
        user_id: userId,
        course_id: taskCourse || null,
        title: taskTitle.trim(),
        date: selectedDateStr,
        completed: false,
      })
      .select("*, course:courses(*)")
      .single();

    if (data) setItems((current) => [...current, data as DailyPlanItem]);
    setTaskTitle("");
    setTaskCourse("");
    setShowTaskForm(false);
  }

  async function toggleItem(item: DailyPlanItem) {
    const completed = !item.completed;
    await supabase.from("daily_plan_items").update({ completed }).eq("id", item.id);
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, completed } : entry)),
    );
  }

  async function deleteItem(id: string) {
    await supabase.from("daily_plan_items").delete().eq("id", id);
    setItems((current) => current.filter((entry) => entry.id !== id));
  }

  async function updateCourseProgress(course: Course) {
    const nextCompleted = Math.max(0, Number(completedSections) || 0);
    const cappedCompleted = course.total_sections
      ? Math.min(nextCompleted, course.total_sections)
      : nextCompleted;

    await supabase
      .from("courses")
      .update({ completed_sections: cappedCompleted })
      .eq("id", course.id);

    setCourses((current) =>
      current.map((item) =>
        item.id === course.id
          ? { ...item, completed_sections: cappedCompleted }
          : item,
      ),
    );
    setEditingCourseId(null);
    setCompletedSections("");
  }

  const doneItems = items.filter((item) => item.completed).length;

  return (
    <div className="mobile-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">{format(selectedDate, "EEEE, MMMM d")}</p>
          <h1>Planner</h1>
          <p>{doneItems}/{items.length} study tasks done</p>
        </div>
        <button className="fab-button" type="button" onClick={() => setShowTaskForm((open) => !open)}>
          <Plus size={22} />
        </button>
      </section>

      <section className="week-strip">
        {weekDays.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            className={isSameDay(day, selectedDate) ? "active" : ""}
            onClick={() => setSelectedDate(day)}
          >
            <span>{format(day, "EEE")}</span>
            <strong>{format(day, "d")}</strong>
          </button>
        ))}
      </section>

      <section className="mobile-card compact-controls">
        <button type="button" onClick={() => setSelectedDate((day) => addDays(day, -1))}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" className={isToday(selectedDate) ? "active" : ""} onClick={() => setSelectedDate(new Date())}>
          Today
        </button>
        <button type="button" onClick={() => setSelectedDate((day) => addDays(day, 1))}>
          <ChevronRight size={18} />
        </button>
      </section>

      {showTaskForm && (
        <section className="mobile-card mobile-stack">
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="What will you study?"
            autoFocus
          />
          <select value={taskCourse} onChange={(event) => setTaskCourse(event.target.value)}>
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <div className="form-actions">
            <button className="ghost-button" type="button" onClick={() => setShowTaskForm(false)}>
              Cancel
            </button>
            <button className="primary-button" type="button" onClick={addPlanItem}>
              Add task
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="center-state">
          <Loader2 className="spin" size={24} />
          <p>Loading planner...</p>
        </div>
      ) : (
        <section className="calendar-card">
          {items.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={30} />
              <h2>No plan for this day</h2>
              <p>Tap plus to add a study task.</p>
            </div>
          ) : (
            items.map((item) => {
              const course = item.course as Course | undefined;
              return (
                <article key={item.id} className={item.completed ? "planner-row done" : "planner-row"}>
                  <button type="button" className="check-box" onClick={() => toggleItem(item)}>
                    {item.completed && <Check size={16} />}
                  </button>
                  <div>
                    <strong>{item.title}</strong>
                    {course && <span style={{ color: course.color }}>{course.name}</span>}
                  </div>
                  <button type="button" className="icon-button" onClick={() => deleteItem(item.id)}>
                    <Trash2 size={17} />
                  </button>
                </article>
              );
            })
          )}
        </section>
      )}

      <section className="mobile-card mobile-stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Courses</p>
            <h2 className="section-title">Learning list</h2>
          </div>
          <button type="button" className="small-button" onClick={() => setShowCourseForm((open) => !open)}>
            {showCourseForm ? "Close" : "Add"}
          </button>
        </div>

        {showCourseForm && (
          <div className="mobile-stack">
            <input
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              placeholder="Course name"
            />
            <input
              type="number"
              value={courseSections}
              onChange={(event) => setCourseSections(event.target.value)}
              placeholder="Total sections"
            />
            <button type="button" className="primary-button" onClick={addCourse}>
              Save course
            </button>
          </div>
        )}

        <div className="course-list">
          {courses.length === 0 ? (
            <p className="muted">No courses yet.</p>
          ) : (
            courses.map((course) => {
              const percent = course.total_sections
                ? Math.round((course.completed_sections / course.total_sections) * 100)
                : 0;
              return (
                <div key={course.id} className="course-row">
                  <span style={{ background: course.color }} />
                  <div className="course-copy">
                    <div className="course-title-row">
                      <strong>{course.name}</strong>
                      {editingCourseId === course.id && (
                        <button
                          type="button"
                          className="course-editor-close"
                          aria-label="Cancel update"
                          onClick={() => {
                            setEditingCourseId(null);
                            setCompletedSections("");
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <p>
                      {percent}% complete - {course.completed_sections}/{course.total_sections || 0} sections
                    </p>
                    <div className="course-progress">
                      <span style={{ width: `${percent}%`, background: course.color }} />
                    </div>
                    {editingCourseId === course.id && (
                      <div className="course-editor">
                        <input
                          type="number"
                          value={completedSections}
                          onChange={(event) => setCompletedSections(event.target.value)}
                          placeholder="Completed sections"
                          autoFocus
                        />
                        <button type="button" onClick={() => updateCourseProgress(course)}>
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                  {editingCourseId !== course.id && (
                    <button
                      type="button"
                      className="small-button course-update"
                      onClick={() => {
                        setEditingCourseId(course.id);
                        setCompletedSections(String(course.completed_sections));
                      }}
                    >
                      Update
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
