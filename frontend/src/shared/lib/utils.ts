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
