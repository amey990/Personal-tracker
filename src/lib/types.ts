// export type TaskType = "recurring" | "one_off";

// export interface Task {
//   id: string;
//   user_id: string;
//   name: string;
//   type: TaskType;
//   target_date?: string;
//   color: string;
//   position: number;
//   active: boolean; // ← add this line
//   created_at: string;
// }

// export interface Completion {
//   id: string;
//   user_id: string;
//   task_id: string;
//   date: string;
//   completed: boolean;
// }

// export interface TaskWithStatus extends Task {
//   completed: boolean;
//   completion_id?: string;
// }

export type TaskType = "recurring" | "one_off";

export interface Task {
  id: string;
  user_id: string;
  name: string;
  type: TaskType;
  target_date?: string;
  color: string;
  position: number;
  active: boolean;
  created_at: string;
}

export interface Completion {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  completed: boolean;
}

export interface TaskWithStatus extends Task {
  completed: boolean;
  completion_id?: string;
}

export interface Spend {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  note?: string;
  date: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target: number;
  current: number;
  remarks?: string;
  deadline?: string;
  color: string;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  description: string;
  calories: number;
  protein?: number;
  created_at: string;
}

export interface CalorieGoal {
  id: string;
  user_id: string;
  year_month: string; // "2026-03"
  daily_calories: number;
}