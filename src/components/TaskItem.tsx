// "use client";
// import { useState } from "react";
// import { Task } from "@/lib/types";
// import { createClient } from "@/lib/supabase/client";

// interface Props {
//   task: Task;
//   onDelete: (id: string) => void;
//   onToggleActive: (task: Task) => void;
//   onRename: () => void;
// }

// export default function TaskItem({
//   task,
//   onDelete,
//   onToggleActive,
//   onRename,
// }: Props) {
//   const [editing, setEditing] = useState(false);
//   const [name, setName] = useState(task.name);
//   const [confirming, setConfirming] = useState(false);
//   const supabase = createClient();

//   async function handleRename() {
//     if (!name.trim() || name === task.name) {
//       setEditing(false);
//       return;
//     }
//     await supabase
//       .from("tasks")
//       .update({ name: name.trim() })
//       .eq("id", task.id);
//     setEditing(false);
//     onRename();
//   }

//   return (
//     <div
//       className={`group flex items-center gap-4 bg-gray-900 border rounded-2xl px-5 py-4 transition-all ${
//         task.active !== false
//           ? "border-gray-800 hover:border-gray-700"
//           : "border-gray-800/50 opacity-50"
//       }`}
//     >
//       {/* Color dot */}
//       <div
//         className="w-3 h-3 rounded-full shrink-0"
//         style={{ backgroundColor: task.color }}
//       />

//       {/* Name / edit */}
//       <div className="flex-1 min-w-0">
//         {editing ? (
//           <input
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             onBlur={handleRename}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") handleRename();
//               if (e.key === "Escape") setEditing(false);
//             }}
//             className="bg-gray-800 text-white rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-violet-500 w-full"
//             autoFocus
//           />
//         ) : (
//           <div className="flex items-center gap-2">
//             <span className="text-white text-sm font-medium truncate">
//               {task.name}
//             </span>
//             <span
//               className={`text-xs px-2 py-0.5 rounded-full ${
//                 task.type === "recurring"
//                   ? "bg-violet-900/50 text-violet-400"
//                   : "bg-amber-900/50 text-amber-400"
//               }`}
//             >
//               {task.type === "recurring" ? "Daily" : task.target_date}
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Actions */}
//       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//         {/* Rename */}
//         <button
//           onClick={() => setEditing(true)}
//           className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition text-xs"
//           title="Rename"
//         >
//           ✏️
//         </button>

//         {/* Toggle active */}
//         <button
//           onClick={() => onToggleActive(task)}
//           className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition text-xs"
//           title={task.active !== false ? "Pause task" : "Resume task"}
//         >
//           {task.active !== false ? "⏸️" : "▶️"}
//         </button>

//         {/* Delete */}
//         {confirming ? (
//           <div className="flex items-center gap-1">
//             <button
//               onClick={() => onDelete(task.id)}
//               className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded-lg transition"
//             >
//               Delete
//             </button>
//             <button
//               onClick={() => setConfirming(false)}
//               className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-700 transition"
//             >
//               Cancel
//             </button>
//           </div>
//         ) : (
//           <button
//             onClick={() => setConfirming(true)}
//             className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800 transition text-xs"
//             title="Delete"
//           >
//             🗑️
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";
import { useState } from "react";
import { Task } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

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
  const [hovered, setHovered] = useState(false);
  const supabase = createClient();

  async function handleRename() {
    if (!name.trim() || name === task.name) {
      setEditing(false);
      return;
    }
    await supabase
      .from("tasks")
      .update({ name: name.trim() })
      .eq("id", task.id);
    setEditing(false);
    onRename();
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        transition: "opacity .2s",
        opacity: task.active === false ? 0.4 : 1,
      }}
    >
      {/* Color dot */}
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          flexShrink: 0,
          background: task.color,
          boxShadow: `0 0 6px ${task.color}66`,
        }}
      />

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setEditing(false);
            }}
            style={{
              background: "var(--card2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "13px",
              outline: "none",
              width: "100%",
            }}
            autoFocus
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "14px",
                color: "var(--text)",
              }}
            >
              {task.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "100px",
                background:
                  task.type === "recurring" ? "#7c3aed20" : "#d9770620",
                color: task.type === "recurring" ? "#a855f7" : "#f59e0b",
                border: `1px solid ${task.type === "recurring" ? "#7c3aed30" : "#d9770630"}`,
              }}
            >
              {task.type === "recurring" ? "Daily" : task.target_date}
            </span>
            {task.active === false && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  background: "var(--card2)",
                  color: "var(--text3)",
                }}
              >
                Paused
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions — always visible on hover */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          opacity: hovered ? 1 : 0,
          transition: "opacity .2s",
        }}
      >
        <button
          onClick={() => setEditing(true)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--card2)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            fontSize: "13px",
          }}
          title="Rename"
        >
          ✏️
        </button>

        <button
          onClick={() => onToggleActive(task)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--card2)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            fontSize: "13px",
          }}
          title={task.active !== false ? "Pause" : "Resume"}
        >
          {task.active !== false ? "⏸️" : "▶️"}
        </button>

        {confirming ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={() => onDelete(task.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                background: "#ef4444",
                border: "none",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                background: "var(--card2)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--card2)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: "13px",
            }}
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}