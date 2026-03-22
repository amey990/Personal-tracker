// "use client";
// import { useState, useEffect } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { Task } from "@/lib/types";
// import TaskForm from "@/components/TaskForm";
// import TaskItem from "@/components/TaskItem";

// function BudgetSetting() {
//   const [limit, setLimit] = useState("");
//   const [current, setCurrent] = useState<number | null>(null);
//   const [saved, setSaved] = useState(false);
//   const supabase = createClient();

//   useEffect(() => {
//     async function load() {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (!user) return;
//       const { data } = await supabase
//         .from("budget_settings")
//         .select("*")
//         .eq("user_id", user.id)
//         .single();
//       if (data) {
//         setCurrent(data.daily_limit);
//         setLimit(String(data.daily_limit));
//       }
//     }
//     load();
//   }, []);

//   async function save() {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user || !limit) return;
//     await supabase
//       .from("budget_settings")
//       .upsert({ user_id: user.id, daily_limit: Number(limit) });
//     setCurrent(Number(limit));
//     setSaved(true);
//     setTimeout(() => setSaved(false), 2000);
//   }

//   return (
//     <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4">
//       <div className="flex items-center justify-between gap-4 flex-wrap">
//         <div>
//           <p className="text-white text-sm font-medium">Daily spend budget</p>
//           <p className="text-gray-600 text-xs mt-0.5">
//             {current
//               ? `Current: ₹${Number(current).toLocaleString("en-IN")}`
//               : "Not set yet"}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <span className="text-gray-500 text-sm">₹</span>
//           <input
//             type="number"
//             placeholder="e.g. 1000"
//             value={limit}
//             onChange={(e) => setLimit(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && save()}
//             className="w-28 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
//           />
//           <button
//             onClick={save}
//             className={`px-4 py-2 rounded-lg text-sm font-medium transition ${saved ? "bg-emerald-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"}`}
//           >
//             {saved ? "✓ Saved" : "Save"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function SettingsPage() {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const supabase = createClient();

//   async function fetchTasks() {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user) return;
//     const { data } = await supabase
//       .from("tasks")
//       .select("*")
//       .eq("user_id", user.id)
//       .order("position");
//     setTasks(data || []);
//     setLoading(false);
//   }

//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   async function handleDelete(taskId: string) {
//     await supabase.from("tasks").delete().eq("id", taskId);
//     setTasks((prev) => prev.filter((t) => t.id !== taskId));
//   }

//   async function handleToggleActive(task: Task) {
//     const updated = { ...task, active: !task.active };
//     await supabase
//       .from("tasks")
//       .update({ active: updated.active })
//       .eq("id", task.id);
//     setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
//   }

//   return (
//     <div className="space-y-6 max-w-3xl">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold text-white">Settings</h1>
//           <p className="text-gray-500 text-sm mt-1">
//             Manage tasks and preferences
//           </p>
//         </div>
//         <button
//           onClick={() => setShowForm(!showForm)}
//           className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
//         >
//           <span className="text-lg leading-none">+</span>
//           Add task
//         </button>
//       </div>

//       {/* Budget */}
//       <div>
//         <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">
//           Finance
//         </p>
//         <BudgetSetting />
//       </div>

//       {/* Add task form */}
//       {showForm && (
//         <TaskForm
//           onSave={() => {
//             setShowForm(false);
//             fetchTasks();
//           }}
//           onCancel={() => setShowForm(false)}
//         />
//       )}

//       {/* Task list */}
//       <div>
//         <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">
//           Daily habits
//         </p>
//         {loading ? (
//           <div className="space-y-3">
//             {[1, 2, 3].map((i) => (
//               <div
//                 key={i}
//                 className="h-16 bg-gray-900 rounded-2xl animate-pulse"
//               />
//             ))}
//           </div>
//         ) : tasks.length === 0 ? (
//           <div className="text-center py-16 text-gray-600">
//             <div className="text-4xl mb-3">📋</div>
//             <p className="text-base">No tasks yet</p>
//             <p className="text-sm mt-1 text-gray-700">
//               Click "+ Add task" to get started
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             <p className="text-xs text-gray-700">
//               {tasks.length} task{tasks.length !== 1 ? "s" : ""}
//             </p>
//             {tasks.map((task) => (
//               <TaskItem
//                 key={task.id}
//                 task={task}
//                 onDelete={handleDelete}
//                 onToggleActive={handleToggleActive}
//                 onRename={fetchTasks}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Task } from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";

function BudgetSetting() {
  const [limit, setLimit] = useState("");
  const [current, setCurrent] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("budget_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setCurrent(data.daily_limit);
        setLimit(String(data.daily_limit));
      }
    }
    load();
  }, []);

  async function save() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !limit) return;
    await supabase
      .from("budget_settings")
      .upsert({ user_id: user.id, daily_limit: Number(limit) });
    setCurrent(Number(limit));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      style={{
        borderRadius: "16px",
        padding: "24px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderTop: "3px solid #10b981",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "15px",
              marginBottom: "4px",
              color: "var(--text)",
            }}
          >
            Daily spend budget
          </p>
          <p style={{ fontSize: "13px", color: "var(--text3)" }}>
            {current
              ? `Current limit: ₹${Number(current).toLocaleString("en-IN")} / day`
              : "No budget set yet"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "12px",
              padding: "10px 14px",
              background: "var(--card2)",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontWeight: 700, color: "#10b981" }}>₹</span>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text)",
                fontSize: "14px",
                outline: "none",
                width: "100px",
                padding: 0,
              }}
            />
          </div>
          <button
            onClick={save}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              background: saved ? "#10b981" : "#a855f7",
              transition: "background .2s",
            }}
          >
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  async function fetchTasks() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("position");
    setTasks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function handleDelete(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleToggleActive(task: Task) {
    const updated = { ...task, active: !task.active };
    await supabase
      .from("tasks")
      .update({ active: updated.active })
      .eq("id", task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        maxWidth: "768px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
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
            Preferences
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
            Settings
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 700,
            color: showForm ? "var(--text2)" : "#fff",
            cursor: "pointer",
            border: "1px solid",
            borderColor: showForm ? "var(--border)" : "transparent",
            background: showForm ? "var(--card)" : "#a855f7",
            transition: "all .2s",
          }}
        >
          {showForm ? "✕ Cancel" : "+ Add task"}
        </button>
      </div>

      {/* Finance */}
      <div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text3)",
            marginBottom: "16px",
          }}
        >
          Finance
        </p>
        <BudgetSetting />
      </div>

      {/* Task form */}
      {showForm && (
        <TaskForm
          onSave={() => {
            setShowForm(false);
            fetchTasks();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Tasks */}
      <div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text3)",
            marginBottom: "16px",
          }}
        >
          Daily habits · {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>

        {loading ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "64px",
                  borderRadius: "16px",
                  background: "var(--card)",
                  animation: "pulse 2s infinite",
                }}
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              borderRadius: "16px",
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: "36px", marginBottom: "12px" }}>📋</p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "4px",
                color: "var(--text)",
              }}
            >
              No tasks yet
            </p>
            <p style={{ fontSize: "13px", color: "var(--text3)" }}>
              Click "+ Add task" above to create your first habit
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  borderRadius: "16px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${task.color}`,
                  overflow: "hidden",
                }}
              >
                <TaskItem
                  task={task}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onRename={fetchTasks}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}