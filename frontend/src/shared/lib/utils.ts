import type { Task } from "@/types/entities";

export interface GroupedCompletedTasks {
  todayTasks: Task[];
  yesterdayTasks: Task[];
  weekTasks: Task[];
  monthTasks: Task[];
  earlierTasks: Task[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;

export function groupCompletedTasks(tasks: Task[]): GroupedCompletedTasks {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - MS_PER_DAY);
  const startOf7DaysAgo = new Date(startOfToday.getTime() - DAYS_IN_WEEK * MS_PER_DAY);
  const startOf30DaysAgo = new Date(startOfToday.getTime() - DAYS_IN_MONTH * MS_PER_DAY);

  const todayTasks: Task[] = [];
  const yesterdayTasks: Task[] = [];
  const weekTasks: Task[] = [];
  const monthTasks: Task[] = [];
  const earlierTasks: Task[] = [];

  for (const task of tasks) {
    const completedDate = task.completed_at ? new Date(task.completed_at) : null;
    if (completedDate && completedDate >= startOfToday) {
      todayTasks.push(task);
    } else if (completedDate && completedDate >= startOfYesterday) {
      yesterdayTasks.push(task);
    } else if (completedDate && completedDate >= startOf7DaysAgo) {
      weekTasks.push(task);
    } else if (completedDate && completedDate >= startOf30DaysAgo) {
      monthTasks.push(task);
    } else {
      earlierTasks.push(task);
    }
  }

  return { todayTasks, yesterdayTasks, weekTasks, monthTasks, earlierTasks };
}

export function formatCompletedAt(isoString: string): string {
  if (!isoString) return "";
  const completedDate = new Date(isoString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

  const timeString = completedDate.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (completedDate >= startOfToday) {
    return `Завершено: Сегодня ${timeString}`;
  }
  if (completedDate >= startOfYesterday) {
    return `Завершено: Вчера ${timeString}`;
  }

  const dateString = completedDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
  return `Завершено: ${dateString} ${timeString}`;
}

export function formatShortDateTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

  const timeString = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (date >= startOfToday) {
    return `Сегодня ${timeString}`;
  }
  if (date >= startOfYesterday) {
    return `Вчера ${timeString}`;
  }

  const dateString = date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
  return `${dateString} ${timeString}`;
}
