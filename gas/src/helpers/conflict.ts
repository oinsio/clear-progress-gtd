// Last-write-wins conflict resolution by updated_at

export type ConflictResult = 'accept' | 'conflict';

export function resolveConflict(
  clientUpdatedAt: string,
  serverUpdatedAt: string
): ConflictResult {
  return clientUpdatedAt >= serverUpdatedAt ? 'accept' : 'conflict';
}