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
