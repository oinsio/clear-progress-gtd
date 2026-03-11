import { CONFLICT_RESOLUTION } from './constants';

// Last-write-wins conflict resolution by updated_at

export type ConflictResult = 'accept' | 'conflict';

export function resolveConflict(
  clientUpdatedAt: string,
  serverUpdatedAt: string
): ConflictResult {
  return clientUpdatedAt >= serverUpdatedAt ? CONFLICT_RESOLUTION.ACCEPT : CONFLICT_RESOLUTION.CONFLICT;
}