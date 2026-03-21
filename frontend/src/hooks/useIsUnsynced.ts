import { useSync } from "@/app/providers/SyncProvider";

export function useIsUnsynced(entity: { updated_at: string }): boolean {
  const { lastSyncedAt } = useSync();
  return lastSyncedAt === null || entity.updated_at > lastSyncedAt;
}
