import { useState, useEffect, useCallback } from "react";
import type { ChecklistItem } from "@/types/entities";
import { ChecklistService, type ChecklistProgress } from "@/services/ChecklistService";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";

const defaultChecklistService = new ChecklistService(new ChecklistRepository());

export interface UseChecklistReturn {
  items: ChecklistItem[];
  progress: ChecklistProgress;
  isLoading: boolean;
  createItem: (title: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
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
    },
    [checklistService, taskId, loadItems],
  );

  const toggleItem = useCallback(
    async (id: string) => {
      await checklistService.toggle(id);
      await loadItems();
    },
    [checklistService, loadItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await checklistService.softDelete(id);
      await loadItems();
    },
    [checklistService, loadItems],
  );

  return { items, progress, isLoading, createItem, toggleItem, deleteItem };
}
