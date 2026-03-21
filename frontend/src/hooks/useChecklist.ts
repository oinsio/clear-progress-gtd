import { useState, useEffect, useCallback } from "react";
import type { ChecklistItem } from "@/types/entities";
import { ChecklistService, type ChecklistProgress } from "@/services/ChecklistService";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultChecklistService = new ChecklistService(new ChecklistRepository());

export interface UseChecklistReturn {
  items: ChecklistItem[];
  progress: ChecklistProgress;
  hasUnsyncedItems: boolean;
  isLoading: boolean;
  reload: () => Promise<void>;
  createItem: (title: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItem: (id: string, title: string) => Promise<void>;
}

export function useChecklist(
  taskId: string,
  checklistService: ChecklistService = defaultChecklistService,
): UseChecklistReturn {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress>({
    completed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush, lastSyncedAt } = useSync();

  const loadItems = useCallback(async () => {
    const [taskItems, taskProgress] = await Promise.all([
      checklistService.getByTaskId(taskId),
      checklistService.getProgress(taskId),
    ]);
    setItems(taskItems);
    setProgress(taskProgress);
    setIsLoading(false);
  }, [checklistService, taskId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const createItem = useCallback(
    async (title: string) => {
      await checklistService.create(taskId, title);
      await loadItems();
      schedulePush();
    },
    [checklistService, taskId, loadItems, schedulePush],
  );

  const toggleItem = useCallback(
    async (id: string) => {
      await checklistService.toggle(id);
      await loadItems();
      schedulePush();
    },
    [checklistService, loadItems, schedulePush],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await checklistService.softDelete(id);
      await loadItems();
      schedulePush();
    },
    [checklistService, loadItems, schedulePush],
  );

  const updateItem = useCallback(
    async (id: string, title: string) => {
      await checklistService.update(id, { title });
      await loadItems();
      schedulePush();
    },
    [checklistService, loadItems, schedulePush],
  );

  const hasUnsyncedItems = items.some(
    (item) => lastSyncedAt === null || item.updated_at > lastSyncedAt,
  );

  return { items, progress, hasUnsyncedItems, isLoading, reload: loadItems, createItem, toggleItem, deleteItem, updateItem };
}
