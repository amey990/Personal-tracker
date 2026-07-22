import { Task } from "@/lib/types";

export const WEEKDAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

const DAY_NAME_TO_VALUE: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

export function getWeekdayValue(date: Date) {
  return ((date.getDay() + 6) % 7) + 1;
}

export function isRestDay(date: Date) {
  const weekday = getWeekdayValue(date);
  return weekday === 4 || weekday === 7;
}

export function getWorkoutWeekday(task: Task) {
  if (task.is_daily) return null;
  if (task.scheduled_weekday) return task.scheduled_weekday;

  const firstWord = task.name.trim().split(/\s+/)[0]?.toLowerCase();
  return DAY_NAME_TO_VALUE[firstWord] || null;
}

export function getTaskScheduleLabel(task: Task) {
  if ((task.category || "habit") === "workout") {
    const exerciseCount = getWorkoutExercises(task).length;
    const exerciseText = exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;

    if (task.is_daily) return `Every day - ${exerciseText}`;

    const weekday = getWorkoutWeekday(task);
    const day = WEEKDAYS.find((item) => item.value === weekday);
    return day ? `${day.label} workout - ${exerciseText}` : "Workout day not set";
  }

  if ((task.category || "habit") === "diet" && task.type === "recurring" && task.diet_day_type) {
    return task.diet_day_type === "rest" ? "Rest day" : "Training day";
  }

  return task.type === "recurring" ? "Every day" : task.target_date || "One time";
}

export function isTaskActiveOnDate(task: Task, date: Date, dateKey: string) {
  const createdAt = task.created_at ? new Date(task.created_at) : null;
  if (createdAt && dateKey < formatDateKey(createdAt)) return false;

  if ((task.category || "habit") === "workout") {
    if (task.is_daily) return true;

    const weekday = getWorkoutWeekday(task);
    if (weekday) return weekday === getWeekdayValue(date);
  }

  if ((task.category || "habit") === "diet" && task.type === "recurring" && task.diet_day_type) {
    const restDay = isRestDay(date);
    return task.diet_day_type === "rest" ? restDay : !restDay;
  }

  return task.type === "recurring" || task.target_date === dateKey;
}

export function getWorkoutExercises(task: Task) {
  if (!Array.isArray(task.exercises)) return [];

  return task.exercises
    .map((exercise) => String(exercise).trim())
    .filter(Boolean);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
