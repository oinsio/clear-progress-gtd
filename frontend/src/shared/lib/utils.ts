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

export function formatDate(isoString: string): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString();
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString();
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentISOString(): string {
  return new Date().toISOString();
}
