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

export function getWorkoutWeekday(task: Task) {
  if (task.scheduled_weekday) return task.scheduled_weekday;

  const firstWord = task.name.trim().split(/\s+/)[0]?.toLowerCase();
  return DAY_NAME_TO_VALUE[firstWord] || null;
}

export function getTaskScheduleLabel(task: Task) {
  if ((task.category || "habit") === "workout") {
    const weekday = getWorkoutWeekday(task);
    const day = WEEKDAYS.find((item) => item.value === weekday);
    const exerciseCount = getWorkoutExercises(task).length;
    const exerciseText = exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;
    return day ? `${day.label} workout - ${exerciseText}` : "Workout day not set";
  }

  return task.type === "recurring" ? "Every day" : task.target_date || "One time";
}

export function isTaskActiveOnDate(task: Task, date: Date, dateKey: string) {
  const createdAt = task.created_at ? new Date(task.created_at) : null;
  if (createdAt && dateKey < formatDateKey(createdAt)) return false;

  if ((task.category || "habit") === "workout") {
    const weekday = getWorkoutWeekday(task);
    if (weekday) return weekday === getWeekdayValue(date);
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
