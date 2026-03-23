// "use client";
// import { useState, useEffect, useRef } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { Task, TaskWithStatus, Spend, Goal } from "@/lib/types";
// import { format } from "date-fns";

// const SPEND_CATEGORIES = [
//   { label: "Food", icon: "🍔" },
//   { label: "Transport", icon: "🚗" },
//   { label: "Shopping", icon: "🛒" },
//   { label: "Health", icon: "💊" },
//   { label: "Entertainment", icon: "🎬" },
//   { label: "Bills", icon: "📄" },
//   { label: "Other", icon: "💸" },
// ];

// const GOAL_COLORS = [
//   "#8b5cf6",
//   "#10b981",
//   "#f59e0b",
//   "#ef4444",
//   "#0ea5e9",
//   "#ec4899",
// ];

// const TODO_KEY = () => `todos_${format(new Date(), "yyyy-MM-dd")}`;

// interface Todo {
//   id: string;
//   text: string;
//   done: boolean;
// }

// export default function DashboardPage() {
//   const supabase = createClient();
//   const today = format(new Date(), "yyyy-MM-dd");
//   const displayDate = format(new Date(), "EEEE, MMMM d");

//   // Habits
//   const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
//   const [ticking, setTicking] = useState<string | null>(null);

//   // Spends
//   const [spends, setSpends] = useState<Spend[]>([]);
//   const [dailyLimit, setDailyLimit] = useState(1000);
//   const [showSpendForm, setShowSpendForm] = useState(false);
//   const [spendAmount, setSpendAmount] = useState("");
//   const [spendCategory, setSpendCategory] = useState("Food");
//   const [spendNote, setSpendNote] = useState("");

//   // Goals
//   const [goals, setGoals] = useState<Goal[]>([]);
//   const [showGoalForm, setShowGoalForm] = useState(false);
//   const [goalTitle, setGoalTitle] = useState("");
//   const [goalTarget, setGoalTarget] = useState("");
//   const [goalUnit, setGoalUnit] = useState("");
//   const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);
//   const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
//   const [goalProgress, setGoalProgress] = useState("");

//   // Todos
//   const [todos, setTodos] = useState<Todo[]>([]);
//   const [todoInput, setTodoInput] = useState("");

//   // User
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     init();
//   }, []);

//   // Load todos from localStorage
//   useEffect(() => {
//     const saved = localStorage.getItem(TODO_KEY());
//     if (saved) setTodos(JSON.parse(saved));
//   }, []);

//   function saveTodos(updated: Todo[]) {
//     setTodos(updated);
//     localStorage.setItem(TODO_KEY(), JSON.stringify(updated));
//   }

//   async function init() {
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();
//     if (!user) return;
//     setUser(user);
//     await Promise.all([
//       loadTasks(user.id),
//       loadSpends(user.id),
//       loadGoals(user.id),
//       loadBudget(user.id),
//     ]);
//     setLoading(false);
//   }

//   async function loadTasks(uid: string) {
//     const { data: allTasks } = await supabase
//       .from("tasks")
//       .select("*")
//       .eq("user_id", uid)
//       .eq("active", true)
//       .order("position");
//     if (!allTasks) return;
//     const todayTasks = allTasks.filter(
//       (t: Task) => t.type === "recurring" || t.target_date === today,
//     );
//     const { data: completions } = await supabase
//       .from("completions")
//       .select("*")
//       .eq("user_id", uid)
//       .eq("date", today);
//     setTasks(
//       todayTasks.map((t: Task) => {
//         const c = completions?.find((c) => c.task_id === t.id);
//         return { ...t, completed: !!c, completion_id: c?.id };
//       }),
//     );
//   }

//   async function loadSpends(uid: string) {
//     const { data } = await supabase
//       .from("spends")
//       .select("*")
//       .eq("user_id", uid)
//       .eq("date", today)
//       .order("created_at", { ascending: false });
//     setSpends(data || []);
//   }

//   async function loadGoals(uid: string) {
//     const { data } = await supabase
//       .from("goals")
//       .select("*")
//       .eq("user_id", uid)
//       .order("created_at");
//     setGoals(data || []);
//   }

//   async function loadBudget(uid: string) {
//     const { data } = await supabase
//       .from("budget_settings")
//       .select("*")
//       .eq("user_id", uid)
//       .single();
//     if (data) setDailyLimit(data.daily_limit);
//   }

//   // --- Habits ---
//   async function toggleTask(task: TaskWithStatus) {
//     if (!user || ticking) return;
//     setTicking(task.id);
//     setTasks((prev) =>
//       prev.map((t) =>
//         t.id === task.id ? { ...t, completed: !t.completed } : t,
//       ),
//     );
//     if (task.completed) {
//       await supabase
//         .from("completions")
//         .delete()
//         .eq("task_id", task.id)
//         .eq("date", today);
//     } else {
//       await supabase
//         .from("completions")
//         .upsert(
//           { user_id: user.id, task_id: task.id, date: today, completed: true },
//           { onConflict: "task_id,date" },
//         );
//     }
//     setTimeout(() => setTicking(null), 300);
//   }

//   // --- Spends ---
//   async function addSpend() {
//     if (!spendAmount || isNaN(Number(spendAmount))) return;
//     const { data } = await supabase
//       .from("spends")
//       .insert({
//         user_id: user.id,
//         amount: Number(spendAmount),
//         category: spendCategory,
//         note: spendNote || null,
//         date: today,
//       })
//       .select()
//       .single();
//     if (data) setSpends((prev) => [data, ...prev]);
//     setSpendAmount("");
//     setSpendNote("");
//     setShowSpendForm(false);
//   }

//   async function deleteSpend(id: string) {
//     await supabase.from("spends").delete().eq("id", id);
//     setSpends((prev) => prev.filter((s) => s.id !== id));
//   }

//   // --- Goals ---
//   async function addGoal() {
//     if (!goalTitle || !goalTarget) return;
//     const { data } = await supabase
//       .from("goals")
//       .insert({
//         user_id: user.id,
//         title: goalTitle,
//         target: Number(goalTarget),
//         current: 0,
//         unit: goalUnit,
//         color: goalColor,
//       })
//       .select()
//       .single();
//     if (data) setGoals((prev) => [...prev, data]);
//     setGoalTitle("");
//     setGoalTarget("");
//     setGoalUnit("");
//     setShowGoalForm(false);
//   }

//   async function updateGoalProgress(goal: Goal, newCurrent: number) {
//     await supabase
//       .from("goals")
//       .update({ current: newCurrent })
//       .eq("id", goal.id);
//     setGoals((prev) =>
//       prev.map((g) => (g.id === goal.id ? { ...g, current: newCurrent } : g)),
//     );
//     setEditingGoal(null);
//     setGoalProgress("");
//   }

//   async function deleteGoal(id: string) {
//     await supabase.from("goals").delete().eq("id", id);
//     setGoals((prev) => prev.filter((g) => g.id !== id));
//   }

//   // --- Todos ---
//   function addTodo() {
//     if (!todoInput.trim()) return;
//     saveTodos([
//       ...todos,
//       { id: Date.now().toString(), text: todoInput.trim(), done: false },
//     ]);
//     setTodoInput("");
//   }

//   function toggleTodo(id: string) {
//     saveTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
//   }

//   function deleteTodo(id: string) {
//     saveTodos(todos.filter((t) => t.id !== id));
//   }

//   // Computed
//   const completedTasks = tasks.filter((t) => t.completed).length;
//   const totalTasks = tasks.length;
//   const habitScore =
//     totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
//   const totalSpent = spends.reduce((sum, s) => sum + Number(s.amount), 0);
//   const remaining = dailyLimit - totalSpent;
//   const doneTodos = todos.filter((t) => t.done).length;

//   if (loading)
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {[1, 2, 3, 4, 5].map((i) => (
//           <div key={i} className="h-48 rounded-2xl animate-pulse bg-gray-900" />
//         ))}
//       </div>
//     );

//   return (
//     <div className="space-y-3">
//       {/* Date header */}
//       <div className="flex items-center justify-between mb-1">
//         <div>
//           <p className="text-xs text-gray-600 uppercase tracking-widest">
//             {displayDate}
//           </p>
//           <h1 className="text-2xl font-bold text-white">Dashboard</h1>
//         </div>
//         <div className="flex items-center gap-3">
//           <div className="text-center">
//             <div
//               className="text-lg font-bold"
//               style={{ color: habitScore === 100 ? "#10b981" : "#8b5cf6" }}
//             >
//               {habitScore}%
//             </div>
//             <div className="text-xs text-gray-600">today</div>
//           </div>
//         </div>
//       </div>

//       {/* Main grid */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* ── HABITS ── */}
//         <div
//           className="rounded-2xl border border-gray-800 p-5 space-y-4"
//           style={{ backgroundColor: "#0f0f1a" }}
//         >
//           <div className="flex items-center justify-between">
//             <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
//               Habits
//             </h2>
//             <span className="text-xs text-gray-600">
//               {completedTasks}/{totalTasks}
//             </span>
//           </div>

//           {/* Mini progress */}
//           <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
//             <div
//               className="h-full rounded-full transition-all duration-500"
//               style={{
//                 width: `${habitScore}%`,
//                 background: habitScore === 100 ? "#10b981" : "#8b5cf6",
//               }}
//             />
//           </div>

//           {/* Task list */}
//           <div className="space-y-2">
//             {totalTasks === 0 ? (
//               <p className="text-xs text-gray-600 py-2">
//                 No tasks —{" "}
//                 <a href="/settings" className="text-violet-500">
//                   add in Settings
//                 </a>
//               </p>
//             ) : (
//               tasks.map((task) => (
//                 <button
//                   key={task.id}
//                   onClick={() => toggleTask(task)}
//                   className="w-full flex items-center gap-3 group"
//                   disabled={!!ticking}
//                 >
//                   <div
//                     className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 border-2 ${
//                       task.completed
//                         ? "border-transparent scale-110"
//                         : "border-gray-700 group-hover:border-gray-500"
//                     }`}
//                     style={
//                       task.completed
//                         ? {
//                             backgroundColor: task.color,
//                             boxShadow: `0 0 8px ${task.color}44`,
//                           }
//                         : {}
//                     }
//                   >
//                     {task.completed && (
//                       <svg
//                         className="w-2.5 h-2.5 text-white"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                         strokeWidth={3}
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           d="M5 13l4 4L19 7"
//                         />
//                       </svg>
//                     )}
//                   </div>
//                   <span
//                     className={`text-sm flex-1 text-left transition-all ${task.completed ? "line-through text-gray-600" : "text-gray-200"}`}
//                   >
//                     {task.name}
//                   </span>
//                   <div
//                     className="w-1.5 h-1.5 rounded-full opacity-50 shrink-0"
//                     style={{ backgroundColor: task.color }}
//                   />
//                 </button>
//               ))
//             )}
//           </div>

//           {habitScore === 100 && totalTasks > 0 && (
//             <div className="text-center py-2 rounded-xl bg-emerald-950/30 border border-emerald-900/30">
//               <span className="text-xs text-emerald-400 font-medium">
//                 Perfect day 🔥
//               </span>
//             </div>
//           )}
//         </div>

//         {/* ── SPENDS ── */}
//         <div
//           className="rounded-2xl border border-gray-800 p-5 space-y-3"
//           style={{ backgroundColor: "#0f0f1a" }}
//         >
//           <div className="flex items-center justify-between">
//             <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
//               Daily spends
//             </h2>
//             <button
//               onClick={() => setShowSpendForm(!showSpendForm)}
//               className="text-xs text-violet-400 hover:text-violet-300 transition"
//             >
//               {showSpendForm ? "cancel" : "+ add"}
//             </button>
//           </div>

//           {/* Budget summary */}
//           <div className="grid grid-cols-2 gap-2">
//             <div
//               className="rounded-xl p-3 text-center"
//               style={{ backgroundColor: "#0a0a14" }}
//             >
//               <div className="text-lg font-bold text-white">
//                 ₹{totalSpent.toLocaleString("en-IN")}
//               </div>
//               <div className="text-xs text-gray-600 mt-0.5">spent</div>
//             </div>
//             <div
//               className="rounded-xl p-3 text-center"
//               style={{ backgroundColor: "#0a0a14" }}
//             >
//               <div
//                 className={`text-lg font-bold ${remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}
//               >
//                 {remaining >= 0 ? "+" : ""}₹
//                 {Math.abs(remaining).toLocaleString("en-IN")}
//               </div>
//               <div className="text-xs text-gray-600 mt-0.5">
//                 {remaining >= 0 ? "remaining" : "over budget"}
//               </div>
//             </div>
//           </div>

//           {/* Budget bar */}
//           <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
//             <div
//               className="h-full rounded-full transition-all duration-500"
//               style={{
//                 width: `${Math.min((totalSpent / dailyLimit) * 100, 100)}%`,
//                 background: remaining >= 0 ? "#10b981" : "#ef4444",
//               }}
//             />
//           </div>

//           {/* Add spend form */}
//           {showSpendForm && (
//             <div className="space-y-2 pt-1">
//               <div className="flex gap-2">
//                 <input
//                   type="number"
//                   placeholder="₹ Amount"
//                   value={spendAmount}
//                   onChange={(e) => setSpendAmount(e.target.value)}
//                   className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
//                   onKeyDown={(e) => e.key === "Enter" && addSpend()}
//                 />
//                 {/* <select
//                   value={spendCategory}
//                   onChange={(e) => setSpendCategory(e.target.value)}
//                   className="bg-gray-800 text-white rounded-lg px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
//                 >
//                   {SPEND_CATEGORIES.map((c) => (
//                     <option key={c.label} value={c.label}>
//                       {c.icon} {c.label}
//                     </option>
//                   ))}
//                 </select> */}
//                 <select
//                   value={spendCategory}
//                   onChange={(e) => setSpendCategory(e.target.value)}
//                   className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
//                   style={{
//                     WebkitAppearance: "none",
//                     appearance: "none",
//                     paddingRight: "2rem",
//                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
//                     backgroundRepeat: "no-repeat",
//                     backgroundPosition: "right 0.6rem center",
//                   }}
//                 >
//                   {SPEND_CATEGORIES.map((c) => (
//                     <option key={c.label} value={c.label}>
//                       {c.icon} {c.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <input
//                 type="text"
//                 placeholder="Note (optional)"
//                 value={spendNote}
//                 onChange={(e) => setSpendNote(e.target.value)}
//                 className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
//                 onKeyDown={(e) => e.key === "Enter" && addSpend()}
//               />
//               <button
//                 onClick={addSpend}
//                 className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-medium transition"
//               >
//                 Save spend
//               </button>
//             </div>
//           )}

//           {/* Transaction list */}
//           <div className="space-y-1 max-h-40 overflow-y-auto">
//             {spends.length === 0 ? (
//               <p className="text-xs text-gray-600 py-2">
//                 No spends logged today
//               </p>
//             ) : (
//               spends.map((spend) => (
//                 <div
//                   key={spend.id}
//                   className="flex items-center justify-between py-1 group"
//                 >
//                   <div className="flex items-center gap-2 min-w-0">
//                     <span className="text-sm">
//                       {SPEND_CATEGORIES.find((c) => c.label === spend.category)
//                         ?.icon || "💸"}
//                     </span>
//                     <div className="min-w-0">
//                       <span className="text-xs text-gray-300 truncate block">
//                         {spend.category}
//                       </span>
//                       {spend.note && (
//                         <span className="text-xs text-gray-600 truncate block">
//                           {spend.note}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2 shrink-0">
//                     <span className="text-sm font-medium text-white">
//                       ₹{Number(spend.amount).toLocaleString("en-IN")}
//                     </span>
//                     <button
//                       onClick={() => deleteSpend(spend.id)}
//                       className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition text-xs"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {/* ── QUICK TODO ── */}
//         <div
//           className="rounded-2xl border border-gray-800 p-5 space-y-3"
//           style={{ backgroundColor: "#0f0f1a" }}
//         >
//           <div className="flex items-center justify-between">
//             <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
//               Quick todo
//             </h2>
//             <span className="text-xs text-gray-600">
//               {doneTodos}/{todos.length}
//             </span>
//           </div>
//           <p className="text-xs text-gray-700">
//             Resets daily · no history saved
//           </p>

//           {/* Add todo */}
//           <div className="flex gap-2">
//             <input
//               type="text"
//               placeholder="Add a task..."
//               value={todoInput}
//               onChange={(e) => setTodoInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && addTodo()}
//               className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
//             />
//             <button
//               onClick={addTodo}
//               className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg text-sm transition"
//             >
//               +
//             </button>
//           </div>

//           {/* Todo list */}
//           <div className="space-y-1 max-h-52 overflow-y-auto">
//             {todos.length === 0 ? (
//               <p className="text-xs text-gray-600 py-2">Nothing here yet</p>
//             ) : (
//               todos.map((todo) => (
//                 <div
//                   key={todo.id}
//                   className="flex items-center gap-2 py-1.5 group"
//                 >
//                   <button
//                     onClick={() => toggleTodo(todo.id)}
//                     className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
//                       todo.done
//                         ? "bg-violet-600 border-violet-600"
//                         : "border-gray-600 hover:border-gray-400"
//                     }`}
//                   >
//                     {todo.done && (
//                       <svg
//                         className="w-2.5 h-2.5 text-white"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                         strokeWidth={3}
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           d="M5 13l4 4L19 7"
//                         />
//                       </svg>
//                     )}
//                   </button>
//                   <span
//                     className={`flex-1 text-sm transition-all ${todo.done ? "line-through text-gray-600" : "text-gray-200"}`}
//                   >
//                     {todo.text}
//                   </span>
//                   <button
//                     onClick={() => deleteTodo(todo.id)}
//                     className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition text-xs"
//                   >
//                     ✕
//                   </button>
//                 </div>
//               ))
//             )}
//           </div>

//           {todos.length > 0 && doneTodos === todos.length && (
//             <div className="text-center py-2 rounded-xl bg-violet-950/30 border border-violet-900/30">
//               <span className="text-xs text-violet-400 font-medium">
//                 All done! ✨
//               </span>
//             </div>
//           )}
//         </div>

//         {/* ── GOALS ── */}
//         <div
//           className="md:col-span-3 rounded-2xl border border-gray-800 p-5 space-y-4"
//           style={{ backgroundColor: "#0f0f1a" }}
//         >
//           <div className="flex items-center justify-between">
//             <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
//               Goals
//             </h2>
//             <button
//               onClick={() => setShowGoalForm(!showGoalForm)}
//               className="text-xs text-violet-400 hover:text-violet-300 transition"
//             >
//               {showGoalForm ? "cancel" : "+ add goal"}
//             </button>
//           </div>

//           {/* Add goal form */}
//           {showGoalForm && (
//             <div
//               className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 rounded-xl border border-gray-800"
//               style={{ backgroundColor: "#0a0a14" }}
//             >
//               <input
//                 placeholder="Goal title"
//                 value={goalTitle}
//                 onChange={(e) => setGoalTitle(e.target.value)}
//                 className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 col-span-2"
//               />
//               <input
//                 placeholder="Target (number)"
//                 value={goalTarget}
//                 onChange={(e) => setGoalTarget(e.target.value)}
//                 className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
//               />
//               <input
//                 placeholder="Unit (₹, books, km...)"
//                 value={goalUnit}
//                 onChange={(e) => setGoalUnit(e.target.value)}
//                 className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
//               />
//               <div className="flex items-center gap-2 col-span-2">
//                 {GOAL_COLORS.map((c) => (
//                   <button
//                     key={c}
//                     onClick={() => setGoalColor(c)}
//                     className={`w-6 h-6 rounded-full transition-all ${goalColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110" : ""}`}
//                     style={{ backgroundColor: c }}
//                   />
//                 ))}
//               </div>
//               <button
//                 onClick={addGoal}
//                 className="col-span-2 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-medium transition"
//               >
//                 Save goal
//               </button>
//             </div>
//           )}

//           {/* Goals grid */}
//           {goals.length === 0 ? (
//             <p className="text-xs text-gray-600 py-2">
//               No goals yet — add one above
//             </p>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//               {goals.map((goal) => {
//                 const pct = Math.min(
//                   Math.round((goal.current / goal.target) * 100),
//                   100,
//                 );
//                 const isEditing = editingGoal?.id === goal.id;
//                 return (
//                   <div
//                     key={goal.id}
//                     className="rounded-xl p-4 space-y-3 border border-gray-800/50 group"
//                     style={{ backgroundColor: "#0a0a14" }}
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-center gap-2">
//                         <div
//                           className="w-2 h-2 rounded-full shrink-0"
//                           style={{ backgroundColor: goal.color }}
//                         />
//                         <span className="text-sm font-medium text-white leading-tight">
//                           {goal.title}
//                         </span>
//                       </div>
//                       <button
//                         onClick={() => deleteGoal(goal.id)}
//                         className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition text-xs ml-1 shrink-0"
//                       >
//                         ✕
//                       </button>
//                     </div>

//                     <div>
//                       <div className="flex justify-between mb-1.5">
//                         <span className="text-xs text-gray-500">
//                           {goal.unit}
//                           {Number(goal.current).toLocaleString()} / {goal.unit}
//                           {Number(goal.target).toLocaleString()}
//                         </span>
//                         <span
//                           className="text-xs font-semibold"
//                           style={{ color: goal.color }}
//                         >
//                           {pct}%
//                         </span>
//                       </div>
//                       <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
//                         <div
//                           className="h-full rounded-full transition-all duration-500"
//                           style={{
//                             width: `${pct}%`,
//                             backgroundColor: goal.color,
//                           }}
//                         />
//                       </div>
//                     </div>

//                     {/* Update progress */}
//                     {isEditing ? (
//                       <div className="flex gap-1">
//                         <input
//                           type="number"
//                           placeholder="New value"
//                           value={goalProgress}
//                           onChange={(e) => setGoalProgress(e.target.value)}
//                           className="flex-1 bg-gray-800 text-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-violet-500"
//                           onKeyDown={(e) =>
//                             e.key === "Enter" &&
//                             updateGoalProgress(goal, Number(goalProgress))
//                           }
//                           autoFocus
//                         />
//                         <button
//                           onClick={() =>
//                             updateGoalProgress(goal, Number(goalProgress))
//                           }
//                           className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-2 py-1 rounded-lg transition"
//                         >
//                           ✓
//                         </button>
//                         <button
//                           onClick={() => setEditingGoal(null)}
//                           className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg transition"
//                         >
//                           ✕
//                         </button>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => {
//                           setEditingGoal(goal);
//                           setGoalProgress(String(goal.current));
//                         }}
//                         className="text-xs text-gray-600 hover:text-violet-400 transition"
//                       >
//                         Update progress →
//                       </button>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskWithStatus, Spend, Goal } from "@/lib/types";
import { format } from "date-fns";

const CATS = [
  { label: "Food", icon: "🍔" },
  { label: "Transport", icon: "🚗" },
  { label: "Shopping", icon: "🛒" },
  { label: "Health", icon: "💊" },
  { label: "Entertainment", icon: "🎬" },
  { label: "Bills", icon: "📄" },
  { label: "Other", icon: "💸" },
];
const GOAL_COLORS = [
  "#a855f7",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
];
const TODO_KEY = () => `todos_${format(new Date(), "yyyy-MM-dd")}`;
interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const CheckIcon = ({ size = 10 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3.5"
    strokeLinecap="round"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);
const PlusIcon = ({ size = 14, color = "white" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const XIcon = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function Card({
  children,
  accent,
  style = {},
}: {
  children: React.ReactNode;
  accent: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 20,
        border: "1px solid var(--border)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ height: 4, background: accent }} />
      <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: "var(--text3)",
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  );
}

function ProgBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        height: 4,
        background: "var(--card3)",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          height: 4,
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: "width .7s ease",
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const displayDate = format(new Date(), "EEEE, MMMM d");
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [ticking, setTicking] = useState<string | null>(null);
  const [spends, setSpends] = useState<Spend[]>([]);
  const [dailyLimit, setDailyLimit] = useState(1000);
  const [showSpend, setShowSpend] = useState(false);
  const [spendAmt, setSpendAmt] = useState("");
  const [spendCat, setSpendCat] = useState("Food");
  const [spendNote, setSpendNote] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoal, setShowGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalRemarks, setGoalRemarks] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editVal, setEditVal] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoInput, setTodoInput] = useState("");
  const [userName, setUserName] = useState("there");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(TODO_KEY());
    if (saved) setTodos(JSON.parse(saved));
    init();
  }, []);

  function saveTodos(u: Todo[]) {
    setTodos(u);
    localStorage.setItem(TODO_KEY(), JSON.stringify(u));
  }

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);
    const raw = user.email?.split("@")[0].split(/[._-]/)[0] || "there";
    setUserName(raw.charAt(0).toUpperCase() + raw.slice(1));
    await Promise.all([
      fetchTasks(user.id),
      fetchSpends(user.id),
      fetchGoals(user.id),
      fetchBudget(user.id),
    ]);
    setLoading(false);
  }

  async function fetchTasks(uid: string) {
    const { data: all } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", uid)
      .eq("active", true)
      .order("position");
    if (!all) return;
    const filtered = all.filter(
      (t: Task) => t.type === "recurring" || t.target_date === today,
    );
    const { data: comps } = await supabase
      .from("completions")
      .select("*")
      .eq("user_id", uid)
      .eq("date", today);
    setTasks(
      filtered.map((t: Task) => {
        const c = comps?.find((c: any) => c.task_id === t.id);
        return { ...t, completed: !!c, completion_id: c?.id };
      }),
    );
  }

  async function fetchSpends(uid: string) {
    const { data } = await supabase
      .from("spends")
      .select("*")
      .eq("user_id", uid)
      .eq("date", today)
      .order("created_at", { ascending: false });
    setSpends(data || []);
  }

  async function fetchGoals(uid: string) {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", uid)
      .order("created_at");
    setGoals(data || []);
  }

  async function fetchBudget(uid: string) {
    const { data } = await supabase
      .from("budget_settings")
      .select("*")
      .eq("user_id", uid)
      .single();
    if (data) setDailyLimit(data.daily_limit);
  }

  async function toggleTask(task: TaskWithStatus) {
    if (!user || ticking) return;
    setTicking(task.id);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t,
      ),
    );
    if (task.completed) {
      await supabase
        .from("completions")
        .delete()
        .eq("task_id", task.id)
        .eq("date", today);
    } else {
      await supabase
        .from("completions")
        .upsert(
          { user_id: user.id, task_id: task.id, date: today, completed: true },
          { onConflict: "task_id,date" },
        );
    }
    setTimeout(() => setTicking(null), 300);
  }

  async function addSpend() {
    if (!spendAmt || isNaN(+spendAmt)) return;
    const { data } = await supabase
      .from("spends")
      .insert({
        user_id: user.id,
        amount: +spendAmt,
        category: spendCat,
        note: spendNote || null,
        date: today,
      })
      .select()
      .single();
    if (data) setSpends((prev) => [data, ...prev]);
    setSpendAmt("");
    setSpendNote("");
    setShowSpend(false);
  }

  async function delSpend(id: string) {
    await supabase.from("spends").delete().eq("id", id);
    setSpends((prev) => prev.filter((s) => s.id !== id));
  }

  async function addGoal() {
    if (!goalTitle || !goalTarget) return;
    await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: goalTitle,
        target: +goalTarget,
        current: 0,
        remarks: goalRemarks || null,
        deadline: goalDeadline || null,
        color: goalColor,
      });
    setGoalTitle("");
    setGoalTarget("");
    setGoalRemarks("");
    setGoalDeadline("");
    setShowGoal(false);
    // Always re-fetch so UI is guaranteed to reflect what's in DB
    await fetchGoals(user.id);
  }

  async function updateGoal(goal: Goal, val: number) {
    await supabase.from("goals").update({ current: val }).eq("id", goal.id);
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, current: val } : g)),
    );
    setEditGoal(null);
    setEditVal("");
  }

  async function delGoal(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const score = total > 0 ? Math.round((done / total) * 100) : 0;
  const spent = spends.reduce((s, x) => s + +x.amount, 0);
  const left = dailyLimit - spent;
  const spentPct = Math.min(Math.round((spent / dailyLimit) * 100), 100);
  const doneTodos = todos.filter((t) => t.done).length;

  const accentPurple = "linear-gradient(90deg,#7c3aed,#a855f7)";
  const accentGreen = "linear-gradient(90deg,#059669,#10b981)";
  const accentAmber = "linear-gradient(90deg,#d97706,#fbbf24)";
  const accentBlue = "linear-gradient(90deg,#2563eb,#60a5fa)";

  if (loading)
    return (
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              height: 280,
              borderRadius: 20,
              background: "var(--card)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );

  return (
    <div
      style={{
        maxWidth: 1400,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* ══ WELCOME ══ */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 4 }}>
            {displayDate}
          </p>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.8px",
              color: "var(--text)",
              lineHeight: 1.1,
            }}
          >
            {greeting}, {userName}!
          </h1>
          <p style={{ fontSize: 14, color: "var(--text2)", marginTop: 6 }}>
            Here's your personal growth overview
          </p>
        </div>
        {score > 0 && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                letterSpacing: "-2px",
                background:
                  score === 100
                    ? "linear-gradient(135deg,#059669,#34d399)"
                    : "linear-gradient(135deg,#7c3aed,#c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {score}%
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              today's score
            </p>
          </div>
        )}
      </div>

      {/* ══ TOP 3 CARDS ══ */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}
      >
        {/* HABITS */}
        <Card accent={accentPurple}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Label>Habits</Label>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(168,85,247,0.12)",
                color: "#a855f7",
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              {done}/{total}
            </span>
          </div>
          <ProgBar pct={score} color={score === 100 ? "#10b981" : "#a855f7"} />

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {total === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text3)",
                  padding: "8px 0",
                }}
              >
                No tasks —{" "}
                <a href="/settings" style={{ color: "#a855f7" }}>
                  add in Settings
                </a>
              </p>
            ) : (
              tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task)}
                  disabled={!!ticking}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "9px 10px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: task.completed
                      ? "rgba(168,85,247,0.06)"
                      : "transparent",
                    transition: "all .2s",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: task.completed
                        ? "none"
                        : "2px solid var(--card3)",
                      background: task.completed ? task.color : "transparent",
                      boxShadow: task.completed
                        ? `0 0 10px ${task.color}55`
                        : "none",
                      transition: "all .25s",
                    }}
                  >
                    {task.completed && <CheckIcon size={10} />}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 500,
                      color: task.completed ? "var(--text3)" : "var(--text)",
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.name}
                  </span>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: task.color,
                      opacity: 0.6,
                    }}
                  />
                </button>
              ))
            )}
          </div>

          {score === 100 && total > 0 && (
            <div
              style={{
                marginTop: 14,
                textAlign: "center",
                padding: "10px 0",
                borderRadius: 12,
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.15)",
                fontSize: 12,
                fontWeight: 600,
                color: "#10b981",
              }}
            >
              Perfect day! 🔥
            </div>
          )}
        </Card>

        {/* SPENDS */}
        <Card accent={accentGreen}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Label>Daily spends</Label>
            <button
              onClick={() => setShowSpend(!showSpend)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: showSpend ? "var(--card3)" : "#059669",
                color: "white",
                transition: "all .2s",
              }}
            >
              {showSpend ? <XIcon size={12} /> : <PlusIcon size={12} />}
            </button>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {[
              {
                label: "spent",
                val: `₹${spent.toLocaleString("en-IN")}`,
                color: "var(--text)",
              },
              {
                label: left >= 0 ? "remaining" : "over budget",
                val: `₹${Math.abs(left).toLocaleString("en-IN")}`,
                color: left >= 0 ? "#10b981" : "#ef4444",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "var(--card2)",
                  border: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>
                  {s.val}
                </p>
                <p
                  style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <ProgBar pct={spentPct} color={left >= 0 ? "#10b981" : "#ef4444"} />

          {/* Add form */}
          {showSpend && (
            <div
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 14,
                background: "var(--card2)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={spendAmt}
                  onChange={(e) => setSpendAmt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSpend()}
                  style={{ flex: 1 }}
                />
                <select
                  value={spendCat}
                  onChange={(e) => setSpendCat(e.target.value)}
                  style={{ width: 130 }}
                >
                  {CATS.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                placeholder="Note (optional)"
                value={spendNote}
                onChange={(e) => setSpendNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSpend()}
              />
              <button
                onClick={addSpend}
                style={{
                  padding: "9px 0",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: "#059669",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Save spend
              </button>
            </div>
          )}

          {/* Transactions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {spends.length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text3)",
                  padding: "8px 0",
                }}
              >
                No spends logged today
              </p>
            ) : (
              spends.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 8px",
                    borderRadius: 10,
                    transition: "background .15s",
                  }}
                  className="group hover:bg-[var(--card2)]"
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "var(--card2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {CATS.find((c) => c.label === s.category)?.icon || "💸"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text)",
                        margin: 0,
                      }}
                    >
                      {s.category}
                    </p>
                    {s.note && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text3)",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.note}
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                      flexShrink: 0,
                    }}
                  >
                    ₹{(+s.amount).toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => delSpend(s.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text3)",
                      padding: 2,
                      opacity: 0.6,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <XIcon size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* TODOS */}
        <Card accent={accentAmber}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Label>Quick todo</Label>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(251,191,36,0.12)",
                color: "#d97706",
                border: "1px solid rgba(251,191,36,0.2)",
              }}
            >
              {doneTodos}/{todos.length}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14 }}>
            Resets daily · no history saved
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              placeholder="Add a task..."
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (() => {
                  if (!todoInput.trim()) return;
                  saveTodos([
                    ...todos,
                    {
                      id: Date.now().toString(),
                      text: todoInput.trim(),
                      done: false,
                    },
                  ]);
                  setTodoInput("");
                })()
              }
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              onClick={() => {
                if (!todoInput.trim()) return;
                saveTodos([
                  ...todos,
                  {
                    id: Date.now().toString(),
                    text: todoInput.trim(),
                    done: false,
                  },
                ]);
                setTodoInput("");
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PlusIcon size={16} />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {todos.length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text3)",
                  padding: "8px 0",
                }}
              >
                Nothing here yet
              </p>
            ) : (
              todos.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: t.done ? "transparent" : "var(--card2)",
                    border: `1px solid ${t.done ? "transparent" : "var(--border)"}`,
                    transition: "all .2s",
                  }}
                >
                  <button
                    onClick={() =>
                      saveTodos(
                        todos.map((x) =>
                          x.id === t.id ? { ...x, done: !x.done } : x,
                        ),
                      )
                    }
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: t.done ? "none" : "2px solid var(--card3)",
                      background: t.done ? "#7c3aed" : "transparent",
                      cursor: "pointer",
                      transition: "all .2s",
                    }}
                  >
                    {t.done && <CheckIcon size={9} />}
                  </button>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: t.done ? "var(--text3)" : "var(--text)",
                      textDecoration: t.done ? "line-through" : "none",
                    }}
                  >
                    {t.text}
                  </span>
                  <button
                    onClick={() =>
                      saveTodos(todos.filter((x) => x.id !== t.id))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text3)",
                      padding: 2,
                      display: "flex",
                    }}
                  >
                    <XIcon size={11} />
                  </button>
                </div>
              ))
            )}
          </div>

          {todos.length > 0 && doneTodos === todos.length && (
            <div
              style={{
                marginTop: 12,
                textAlign: "center",
                padding: "10px 0",
                borderRadius: 12,
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.15)",
                fontSize: 12,
                fontWeight: 600,
                color: "#a855f7",
              }}
            >
              All done! ✨
            </div>
          )}
        </Card>
      </div>

      {/* ══ GOALS ══ */}
      <Card accent={accentBlue}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Label>Goals</Label>
          <button
            onClick={() => setShowGoal(!showGoal)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: showGoal ? "var(--card2)" : "#2563eb",
              color: showGoal ? "var(--text2)" : "white",
              fontSize: 12,
              fontWeight: 600,
              transition: "all .2s",
            }}
          >
            {showGoal ? (
              <>
                <XIcon size={11} /> Cancel
              </>
            ) : (
              <>
                <PlusIcon size={11} /> Add goal
              </>
            )}
          </button>
        </div>

        {showGoal && (
          <div
            style={{
              marginBottom: 20,
              padding: 18,
              borderRadius: 16,
              background: "var(--card2)",
              border: "1px solid var(--border)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <input
              placeholder="Goal title"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              style={{ gridColumn: "1/3" }}
            />
            <input
              type="number"
              placeholder="Target number"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
            />
            <input
              type="date"
              placeholder="Deadline"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
              style={{ colorScheme: "dark" }}
            />
            <input
              placeholder="Remarks (optional)"
              value={goalRemarks}
              onChange={(e) => setGoalRemarks(e.target.value)}
              style={{ gridColumn: "1/3" }}
            />
            <div
              style={{
                gridColumn: "1/3",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 4px",
              }}
            >
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setGoalColor(c)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: c,
                    border: "none",
                    cursor: "pointer",
                    outline: goalColor === c ? `3px solid ${c}` : "none",
                    outlineOffset: 2,
                    flexShrink: 0,
                    transition: "transform .15s",
                    transform: goalColor === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={addGoal}
              style={{
                gridColumn: "1/3",
                padding: "10px 0",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "#2563eb",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Save goal
            </button>
          </div>
        )}

        {goals.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text3)", padding: "8px 0" }}>
            No goals yet — click "Add goal" to start tracking
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {goals.map((goal) => {
              const pct = Math.min(
                Math.round((goal.current / goal.target) * 100),
                100,
              );
              const isEdit = editGoal?.id === goal.id;
              return (
                <div
                  key={goal.id}
                  style={{
                    padding: "18px 20px",
                    borderRadius: 18,
                    background: "var(--card2)",
                    border: "1px solid var(--border)",
                    position: "relative",
                    overflow: "hidden",
                    transition: "border-color .2s",
                  }}
                >
                  {/* Colored left bar */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 16,
                      bottom: 16,
                      width: 3,
                      borderRadius: "0 4px 4px 0",
                      background: goal.color,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                      paddingLeft: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text)",
                        lineHeight: 1.3,
                      }}
                    >
                      {goal.title}
                    </p>
                    <button
                      onClick={() => delGoal(goal.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text3)",
                        padding: 2,
                        display: "flex",
                      }}
                    >
                      <XIcon size={12} />
                    </button>
                  </div>

                  <div style={{ paddingLeft: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          color: goal.color,
                          letterSpacing: "-1px",
                        }}
                      >
                        {pct}%
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text3)",
                          textAlign: "right",
                          lineHeight: 1.5,
                        }}
                      >
                        {Number(goal.current).toLocaleString()} / {Number(goal.target).toLocaleString()}
                        {goal.deadline && (
                          <><br /><span style={{ color: "#f59e0b" }}>📅 {new Date(goal.deadline + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></>
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        height: 5,
                        background: "var(--card3)",
                        borderRadius: 5,
                        overflow: "hidden",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          height: 5,
                          width: `${pct}%`,
                          background: goal.color,
                          borderRadius: 5,
                          transition: "width .7s ease",
                        }}
                      />
                    </div>

                    {goal.remarks && (
                      <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, fontStyle: "italic" }}>
                        {goal.remarks}
                      </p>
                    )}

                    {isEdit ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="number"
                          placeholder="New value"
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && updateGoal(goal, +editVal)
                          }
                          autoFocus
                          style={{ flex: 1, fontSize: 12, padding: "7px 10px" }}
                        />
                        <button
                          onClick={() => updateGoal(goal, +editVal)}
                          style={{
                            padding: "7px 12px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            background: goal.color,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditGoal(null)}
                          style={{
                            padding: "7px 10px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            background: "var(--card3)",
                            color: "var(--text3)",
                            fontSize: 12,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditGoal(goal);
                          setEditVal(String(goal.current));
                        }}
                        style={{
                          background: "none",
                          border: `1px solid ${goal.color}33`,
                          borderRadius: 8,
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          color: goal.color,
                          transition: "all .2s",
                          width: "100%",
                        }}
                      >
                        Update progress →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}