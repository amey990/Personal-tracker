export type TaskType = "recurring" | "one_off";
export type TaskCategory = "habit" | "diet" | "workout";

export interface Task {
  id: string;
  user_id: string;
  name: string;
  type: TaskType;
  category: TaskCategory;
  target_date?: string;
  scheduled_weekday?: number | null;
  exercises?: string[] | null;
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
  completed_exercises?: number[] | null;
}

export interface TaskWithStatus extends Task {
  completed: boolean;
  completion_id?: string;
  completedExercises?: number[];
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

export interface Course {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  total_sections: number;
  completed_sections: number;
  color: string;
  position: number;
  active: boolean;
  created_at: string;
}

export interface DailyPlanItem {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
  // Joined field (from query)
  course?: Course;
}
