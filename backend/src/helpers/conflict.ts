// Last-write-wins conflict resolution by updated_at

type ConflictResult = 'accept' | 'conflict';

function resolveConflict(
  clientUpdatedAt: string,
  serverUpdatedAt: string
): ConflictResult {
  return clientUpdatedAt >= serverUpdatedAt ? 'accept' : 'conflict';
}