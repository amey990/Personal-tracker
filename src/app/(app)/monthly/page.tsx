// "use client";
// import { useState, useEffect } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { Task, Completion } from "@/lib/types";
// import {
//   format,
//   startOfMonth,
//   endOfMonth,
//   eachDayOfInterval,
//   isFuture,
//   isToday,
//   parseISO,
// } from "date-fns";

// export default function MonthlyPage() {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [completions, setCompletions] = useState<Completion[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const supabase = createClient();

//   const monthStart = startOfMonth(currentDate);
//   const monthEnd = endOfMonth(currentDate);
//   const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
//   const monthLabel = format(currentDate, "MMMM yyyy");

//   useEffect(() => {
//     loadData();
//   }, [currentDate]);

//   async function loadData() {
//     setLoading(true);
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user) return;

//     const [{ data: taskData }, { data: completionData }] = await Promise.all([
//       supabase
//         .from("tasks")
//         .select("*")
//         .eq("user_id", user.id)
//         .eq("active", true)
//         .order("position"),
//       supabase
//         .from("completions")
//         .select("*")
//         .eq("user_id", user.id)
//         .gte("date", format(monthStart, "yyyy-MM-dd"))
//         .lte("date", format(monthEnd, "yyyy-MM-dd")),
//     ]);

//     setTasks(taskData || []);
//     setCompletions(completionData || []);
//     setLoading(false);
//   }

//   function isTaskActiveOnDay(task: Task, day: Date): boolean {
//     const dayStr = format(day, "yyyy-MM-dd");
//     if (task.type === "recurring") return true;
//     return task.target_date === dayStr;
//   }

//   function getCellStatus(
//     task: Task,
//     day: Date,
//   ): "completed" | "missed" | "future" | "inactive" {
//     if (!isTaskActiveOnDay(task, day)) return "inactive";
//     if (isFuture(day) && !isToday(day)) return "future";
//     const dayStr = format(day, "yyyy-MM-dd");
//     const done = completions.some(
//       (c) => c.task_id === task.id && c.date === dayStr,
//     );
//     return done ? "completed" : "missed";
//   }

//   function getDayScore(day: Date): number {
//     if (isFuture(day) && !isToday(day)) return -1;
//     const activeTasks = tasks.filter((t) => isTaskActiveOnDay(t, day));
//     if (activeTasks.length === 0) return -1;
//     const dayStr = format(day, "yyyy-MM-dd");
//     const done = completions.filter(
//       (c) => activeTasks.some((t) => t.id === c.task_id) && c.date === dayStr,
//     ).length;
//     return Math.round((done / activeTasks.length) * 100);
//   }

//   function getTaskStreak(task: Task): number {
//     let streak = 0;
//     const today = new Date();
//     for (let i = 0; i < 365; i++) {
//       const d = new Date(today);
//       d.setDate(d.getDate() - i);
//       if (!isTaskActiveOnDay(task, d)) break;
//       const dayStr = format(d, "yyyy-MM-dd");
//       const done = completions.some(
//         (c) => c.task_id === task.id && c.date === dayStr,
//       );
//       if (done) streak++;
//       else if (i > 0) break;
//     }
//     return streak;
//   }

//   const totalDaysWithData = days.filter(
//     (d) => !isFuture(d) || isToday(d),
//   ).length;
//   const perfectDays = days.filter((d) => getDayScore(d) === 100).length;

//   return (
//     <div className="space-y-8">
//       {/* Header + nav */}
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-gray-500 text-sm uppercase tracking-widest mb-1">
//             Overview
//           </p>
//           <h1 className="text-3xl font-semibold text-white">{monthLabel}</h1>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() =>
//               setCurrentDate((d) => {
//                 const n = new Date(d);
//                 n.setMonth(n.getMonth() - 1);
//                 return n;
//               })
//             }
//             className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition text-lg"
//           >
//             ←
//           </button>
//           <button
//             onClick={() => setCurrentDate(new Date())}
//             className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition text-sm"
//           >
//             Today
//           </button>
//           <button
//             onClick={() =>
//               setCurrentDate((d) => {
//                 const n = new Date(d);
//                 n.setMonth(n.getMonth() + 1);
//                 return n;
//               })
//             }
//             className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition text-lg"
//           >
//             →
//           </button>
//         </div>
//       </div>

//       {/* Summary stats */}
//       {!loading && (
//         <div className="grid grid-cols-3 gap-4">
//           {[
//             {
//               label: "Perfect days",
//               value: perfectDays,
//               color: "text-emerald-400",
//             },
//             {
//               label: "Tasks tracked",
//               value: tasks.length,
//               color: "text-violet-400",
//             },
//             {
//               label: "Days logged",
//               value: totalDaysWithData,
//               color: "text-amber-400",
//             },
//           ].map((stat) => (
//             <div
//               key={stat.label}
//               className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-center"
//             >
//               <div className={`text-2xl font-semibold ${stat.color}`}>
//                 {stat.value}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
//             </div>
//           ))}
//         </div>
//       )}

//       {loading ? (
//         <div className="h-64 bg-gray-900 rounded-2xl animate-pulse" />
//       ) : tasks.length === 0 ? (
//         <div className="text-center py-24 text-gray-600">
//           <div className="text-5xl mb-4">📅</div>
//           <p className="text-lg text-gray-400">No tasks yet</p>
//           <p className="text-sm mt-1">
//             Add tasks in{" "}
//             <a href="/settings" className="text-violet-400">
//               Settings
//             </a>
//           </p>
//         </div>
//       ) : (
//         <>
//           {/* Grid */}
//           <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
//             {/* Column headers — day numbers */}
//             <div className="overflow-x-auto">
//               <table className="w-full text-xs">
//                 <thead>
//                   <tr className="border-b border-gray-800">
//                     {/* Task name column */}
//                     <th className="text-left px-4 py-3 text-gray-500 font-medium w-32 min-w-32">
//                       Task
//                     </th>
//                     {days.map((day) => (
//                       <th
//                         key={day.toISOString()}
//                         className={`px-1 py-3 font-medium text-center min-w-7 ${
//                           isToday(day) ? "text-violet-400" : "text-gray-600"
//                         }`}
//                       >
//                         {format(day, "d")}
//                       </th>
//                     ))}
//                     <th className="px-3 py-3 text-gray-500 font-medium text-right min-w-16">
//                       Streak
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {tasks.map((task, i) => (
//                     <tr
//                       key={task.id}
//                       className={
//                         i !== tasks.length - 1
//                           ? "border-b border-gray-800/50"
//                           : ""
//                       }
//                     >
//                       {/* Task name */}
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-2">
//                           <div
//                             className="w-2 h-2 rounded-full shrink-0"
//                             style={{ backgroundColor: task.color }}
//                           />
//                           <span className="text-gray-300 text-xs truncate max-w-24">
//                             {task.name}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Day cells */}
//                       {days.map((day) => {
//                         const status = getCellStatus(task, day);
//                         return (
//                           <td
//                             key={day.toISOString()}
//                             className="px-1 py-3 text-center"
//                           >
//                             {status === "inactive" ? (
//                               <div className="w-5 h-5 mx-auto" />
//                             ) : status === "future" ? (
//                               <div className="w-5 h-5 mx-auto rounded-md bg-gray-800/50" />
//                             ) : status === "completed" ? (
//                               <div
//                                 className="w-5 h-5 mx-auto rounded-md flex items-center justify-center"
//                                 style={{
//                                   backgroundColor: task.color + "33",
//                                   border: `1px solid ${task.color}66`,
//                                 }}
//                               >
//                                 <div
//                                   className="w-2 h-2 rounded-sm"
//                                   style={{ backgroundColor: task.color }}
//                                 />
//                               </div>
//                             ) : (
//                               // missed
//                               <div className="w-5 h-5 mx-auto rounded-md bg-red-950/60 border border-red-900/60 flex items-center justify-center">
//                                 <div className="w-2 h-2 rounded-sm bg-red-700/80" />
//                               </div>
//                             )}
//                           </td>
//                         );
//                       })}

//                       {/* Streak */}
//                       <td className="px-3 py-3 text-right">
//                         {(() => {
//                           const streak = getTaskStreak(task);
//                           return streak > 0 ? (
//                             <span className="text-xs font-medium text-orange-400">
//                               🔥{streak}
//                             </span>
//                           ) : (
//                             <span className="text-xs text-gray-700">—</span>
//                           );
//                         })()}
//                       </td>
//                     </tr>
//                   ))}

//                   {/* Day score row */}
//                   <tr className="border-t border-gray-800">
//                     <td className="px-4 py-3 text-gray-600 text-xs">Score</td>
//                     {days.map((day) => {
//                       const score = getDayScore(day);
//                       return (
//                         <td
//                           key={day.toISOString()}
//                           className="px-1 py-3 text-center"
//                         >
//                           {score === -1 ? (
//                             <div className="w-5 h-5 mx-auto" />
//                           ) : (
//                             <div
//                               className="w-5 h-5 mx-auto rounded-md"
//                               style={{
//                                 backgroundColor:
//                                   score === 100
//                                     ? "#10b98133"
//                                     : score >= 50
//                                       ? "#f59e0b22"
//                                       : "#ef444422",
//                                 border: `1px solid ${
//                                   score === 100
//                                     ? "#10b98166"
//                                     : score >= 50
//                                       ? "#f59e0b44"
//                                       : "#ef444444"
//                                 }`,
//                               }}
//                               title={`${score}%`}
//                             />
//                           )}
//                         </td>
//                       );
//                     })}
//                     <td className="px-3 py-3" />
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Legend */}
//           <div className="flex items-center gap-6 text-xs text-gray-500">
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-violet-900/40 border border-violet-700/40" />
//               <span>Completed</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-red-950/60 border border-red-900/60" />
//               <span>Missed</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-gray-800/50" />
//               <span>Future</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <span>🔥</span>
//               <span>Current streak</span>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Task, Completion } from "@/lib/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isFuture,
  isToday,
} from "date-fns";

export default function MonthlyPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  // Calorie data
  const [calsByDay, setCalsByDay] = useState<Record<string, { total: number; meals: Record<string, number> }>>({});
  const [calGoal, setCalGoal] = useState<number | null>(null);
  const supabase = createClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthLabel = format(currentDate, "MMMM yyyy");

  useEffect(() => {
    loadData();
  }, [currentDate]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ym = format(currentDate, "yyyy-MM");
    const [{ data: taskData }, { data: completionData }, { data: foodData }, { data: goalData }] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).eq("active", true).order("position"),
      supabase.from("completions").select("*").eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd")).lte("date", format(monthEnd, "yyyy-MM-dd")),
      supabase.from("food_logs").select("date,calories,meal_type").eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd")).lte("date", format(monthEnd, "yyyy-MM-dd")),
      supabase.from("calorie_goal").select("daily_calories").eq("user_id", user.id).eq("year_month", ym).maybeSingle(),
    ]);
    setTasks(taskData || []);
    setCompletions(completionData || []);
    // Aggregate calories by date and meal
    const byDay: Record<string, { total: number; meals: Record<string, number> }> = {};
    for (const row of (foodData || [])) {
      if (!byDay[row.date]) byDay[row.date] = { total: 0, meals: {} };
      byDay[row.date].total += Number(row.calories);
      byDay[row.date].meals[row.meal_type] = (byDay[row.date].meals[row.meal_type] || 0) + Number(row.calories);
    }
    setCalsByDay(byDay);
    setCalGoal(goalData?.daily_calories ?? null);
    setLoading(false);
  }

  function isActiveOnDay(task: Task, day: Date) {
    const d = format(day, "yyyy-MM-dd");
    return task.type === "recurring" || task.target_date === d;
  }

  function getCellStatus(task: Task, day: Date) {
    if (!isActiveOnDay(task, day)) return "inactive";
    if (isFuture(day) && !isToday(day)) return "future";
    const d = format(day, "yyyy-MM-dd");
    return completions.some((c) => c.task_id === task.id && c.date === d)
      ? "completed"
      : "missed";
  }

  function getDayScore(day: Date) {
    if (isFuture(day) && !isToday(day)) return -1;
    const active = tasks.filter((t) => isActiveOnDay(t, day));
    if (!active.length) return -1;
    const d = format(day, "yyyy-MM-dd");
    const done = completions.filter(
      (c) => active.some((t) => t.id === c.task_id) && c.date === d,
    ).length;
    return Math.round((done / active.length) * 100);
  }

  function getStreak(task: Task) {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (!isActiveOnDay(task, d)) break;
      const ds = format(d, "yyyy-MM-dd");
      if (completions.some((c) => c.task_id === task.id && c.date === ds))
        streak++;
      else if (i > 0) break;
    }
    return streak;
  }

  const perfectDays = days.filter((d) => getDayScore(d) === 100).length;
  const passedDays = days.filter((d) => !isFuture(d) || isToday(d)).length;
  const totalCalConsumed = Object.values(calsByDay).reduce((s, d) => s + d.total, 0);
  const avgCalPerDay = passedDays > 0 ? Math.round(totalCalConsumed / passedDays) : 0;

  const statCards = [
    { label: "Perfect days", value: perfectDays, color: "#10b981" },
    { label: "Tasks tracked", value: tasks.length, color: "#a855f7" },
    { label: "Days logged", value: passedDays, color: "#f59e0b" },
    { label: "Avg kcal/day", value: avgCalPerDay ? `${avgCalPerDay}` : "—", color: "#ef4444" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text3)",
              marginBottom: "4px",
            }}
          >
            Overview
          </p>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              lineHeight: 1.1,
            }}
          >
            {monthLabel}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <button
            onClick={() =>
              setCurrentDate((d) => {
                const n = new Date(d);
                n.setMonth(n.getMonth() - 1);
                return n;
              })
            }
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: 700,
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text2)",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: "0 16px",
              height: "40px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 600,
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text2)",
              cursor: "pointer",
            }}
          >
            Today
          </button>
          <button
            onClick={() =>
              setCurrentDate((d) => {
                const n = new Date(d);
                n.setMonth(n.getMonth() + 1);
                return n;
              })
            }
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: 700,
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text2)",
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{
              borderRadius: "16px",
              padding: "24px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderTop: `3px solid ${s.color}`,
              minHeight: "110px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text3)",
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontSize: "48px",
                fontWeight: 800,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div
          style={{
            height: "256px",
            borderRadius: "16px",
            background: "var(--card)",
            animation: "pulse 2s infinite",
          }}
        />
      ) : tasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "96px 0",
            borderRadius: "16px",
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ fontSize: "40px", marginBottom: "16px" }}>📅</p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "8px",
              color: "var(--text)",
            }}
          >
            No tasks yet
          </p>
          <p style={{ fontSize: "14px", color: "var(--text3)" }}>
            Add tasks in{" "}
            <a href="/settings" style={{ color: "#a855f7" }}>
              Settings
            </a>
          </p>
        </div>
      ) : (
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderTop: "3px solid",
            borderImageSlice: 1,
            borderImageSource: "linear-gradient(90deg,#7c3aed,#2563eb)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "800px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px 24px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text3)",
                      fontSize: "10px",
                      width: "140px",
                      minWidth: "140px",
                    }}
                  >
                    Task
                  </th>
                  {days.map((day) => (
                    <th
                      key={day.toISOString()}
                      style={{
                        padding: "16px 0",
                        textAlign: "center",
                        fontWeight: 600,
                        minWidth: "30px",
                        color: isToday(day) ? "#a855f7" : "var(--text3)",
                        fontSize: "11px",
                      }}
                    >
                      {format(day, "d")}
                    </th>
                  ))}
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "right",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text3)",
                      fontSize: "10px",
                      minWidth: "64px",
                    }}
                  >
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom:
                        i < tasks.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <td style={{ padding: "12px 24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: task.color,
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--text2)",
                            fontSize: "12px",
                            maxWidth: "100px",
                          }}
                        >
                          {task.name}
                        </span>
                      </div>
                    </td>
                    {days.map((day) => {
                      const status = getCellStatus(task, day);
                      return (
                        <td
                          key={day.toISOString()}
                          style={{ padding: "12px 0", textAlign: "center" }}
                        >
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              margin: "0 auto",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background:
                                status === "completed"
                                  ? task.color + "25"
                                  : status === "missed"
                                    ? "#ef444415"
                                    : status === "future"
                                      ? "var(--card2)"
                                      : "transparent",
                              border:
                                status === "completed"
                                  ? `1px solid ${task.color}55`
                                  : status === "missed"
                                    ? "1px solid #ef444435"
                                    : status === "future"
                                      ? "1px solid var(--border)"
                                      : "none",
                            }}
                          >
                            {(status === "completed" ||
                              status === "missed") && (
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "3px",
                                  background:
                                    status === "completed"
                                      ? task.color
                                      : "#ef444455",
                                }}
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ padding: "12px 20px", textAlign: "right" }}>
                      {(() => {
                        const s = getStreak(task);
                        return s > 0 ? (
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "12px",
                              color: "#f59e0b",
                            }}
                          >
                            🔥{s}
                          </span>
                        ) : (
                          <span
                            style={{ color: "var(--text3)", fontSize: "12px" }}
                          >
                            —
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid var(--border)" }}>
                  <td
                    style={{
                      padding: "12px 24px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text3)",
                      fontSize: "10px",
                    }}
                  >
                    Score
                  </td>
                  {days.map((day) => {
                    const score = getDayScore(day);
                    return (
                      <td
                        key={day.toISOString()}
                        style={{ padding: "12px 0", textAlign: "center" }}
                      >
                        {score >= 0 ? (
                          <div
                            title={`${score}%`}
                            style={{
                              width: "20px",
                              height: "20px",
                              margin: "0 auto",
                              borderRadius: "6px",
                              background:
                                score === 100
                                  ? "#10b98120"
                                  : score >= 50
                                    ? "#f59e0b15"
                                    : "#ef444415",
                              border: `1px solid ${score === 100 ? "#10b98140" : score >= 50 ? "#f59e0b30" : "#ef444430"}`,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              margin: "0 auto",
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td />
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nutrition Table */}
      {!loading && (
        <div style={{ background: "var(--card)", borderRadius: "20px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${days.length * 30 + 200}px` }}>
              <thead style={{ background: "var(--card2)" }}>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "16px 24px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontSize: "10px", width: "140px", minWidth: "140px" }}>
                    Nutrition
                  </th>
                  {days.map((day) => (
                    <th key={day.toISOString()} style={{ padding: "16px 0", textAlign: "center", fontWeight: 600, minWidth: "30px", color: isToday(day) ? "#a855f7" : "var(--text3)", fontSize: "11px" }}>
                      {format(day, "d")}
                    </th>
                  ))}
                  <th style={{ padding: "16px 20px", textAlign: "right", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontSize: "10px", minWidth: "64px" }}>
                    Avg
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "breakfast", label: "Breakfast", emoji: "🌅", color: "#fcd34d" },
                  { key: "lunch", label: "Lunch", emoji: "☀️", color: "#fb923c" },
                  { key: "dinner", label: "Dinner", emoji: "🌙", color: "#818cf8" },
                  { key: "snack", label: "Snack", emoji: "🍎", color: "#f472b6" },
                  { key: "other", label: "Other", emoji: "🍽️", color: "#9ca3af" },
                ].map((meal, i) => {
                  let totalMealKcal = 0;
                  let daysWithMeal = 0;
                  Object.values(calsByDay).forEach(d => {
                    if (d.meals[meal.key]) {
                      totalMealKcal += d.meals[meal.key];
                      daysWithMeal++;
                    }
                  });
                  const avg = daysWithMeal > 0 ? Math.round(totalMealKcal / daysWithMeal) : 0;
                  
                  return (
                    <tr key={meal.key} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{meal.emoji}</span>
                          <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: "12px" }}>{meal.label}</span>
                        </div>
                      </td>
                      {days.map((day) => {
                        const ds = format(day, "yyyy-MM-dd");
                        const kcal = calsByDay[ds]?.meals[meal.key];
                        const isFut = isFuture(day) && !isToday(day);
                        
                        return (
                          <td key={day.toISOString()} style={{ padding: "12px 0", textAlign: "center" }}>
                            {!isFut && kcal ? (
                              <div
                                title={`${kcal} kcal - ${meal.label}`}
                                style={{
                                  width: "20px", height: "20px", margin: "0 auto", borderRadius: "6px",
                                  background: `${meal.color}25`,
                                  border: `1px solid ${meal.color}55`,
                                  display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                              >
                                <div style={{ width: "8px", height: "8px", borderRadius: "3px", background: meal.color }} />
                              </div>
                            ) : (
                              <div style={{ width: "20px", height: "20px", margin: "0 auto", borderRadius: "6px", background: !isFut && calsByDay[ds]?.total > 0 ? "#ef444410" : "transparent" }} />
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: "12px 20px", textAlign: "right" }}>
                        {avg > 0 ? <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text3)" }}>{avg}</span> : <span style={{ color: "var(--text3)", fontSize: "12px" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Daily Total Kcal Row */}
                <tr style={{ borderTop: "1px solid var(--border)", background: "var(--card2)" }}>
                  <td style={{ padding: "12px 24px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text)", fontSize: "11px" }}>
                    🔥 Total Kcal
                  </td>
                  {days.map((day) => {
                    const ds = format(day, "yyyy-MM-dd");
                    const kcal = calsByDay[ds]?.total;
                    const isFut = isFuture(day) && !isToday(day);
                    if (isFut || !kcal) return (
                      <td key={day.toISOString()} style={{ padding: "12px 0", textAlign: "center" }}>
                        <div style={{ width: "20px", height: "20px", margin: "0 auto" }} />
                      </td>
                    );
                    const pct = calGoal ? kcal / calGoal : null;
                    const bg = !pct ? "#a855f720"
                      : pct > 1.10 ? "#ef444420"
                      : pct > 0.90 ? "#f59e0b15"
                      : "#10b98120";
                    const border = !pct ? "#a855f740"
                      : pct > 1.10 ? "#ef444440"
                      : pct > 0.90 ? "#f59e0b30"
                      : "#10b98140";
                    return (
                      <td key={day.toISOString()} style={{ padding: "12px 0", textAlign: "center" }}>
                        <div
                          title={`${kcal} kcal${calGoal ? ` / ${calGoal} goal` : ""}`}
                          style={{ width: "20px", height: "20px", margin: "0 auto", borderRadius: "6px", background: bg, border: `1px solid ${border}` }}
                        />
                      </td>
                    );
                  })}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          fontSize: "12px",
          color: "var(--text3)",
        }}
      >
        {[
          { bg: "#a855f725", border: "#a855f745", label: "Completed" },
          { bg: "#ef444415", border: "#ef444435", label: "Missed" },
          { bg: "var(--card2)", border: "var(--border)", label: "Future" },
        ].map((l) => (
          <div
            key={l.label}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "4px",
                background: l.bg,
                border: `1px solid ${l.border}`,
              }}
            />
            <span>{l.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🔥</span>
          <span>Streak</span>
        </div>
      </div>
    </div>
  );
}