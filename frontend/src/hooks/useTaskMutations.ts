import { useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { useSync } from "@/app/providers/SyncProvider";

export interface UseTaskMutationsReturn {
  completeTask: (id: string) => Promise<string | null>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useTaskMutations(
  taskService: TaskService,
  onReload: () => Promise<void>,
): UseTaskMutationsReturn {
  const { schedulePush } = useSync();

  const completeTask = useCallback(
    async (id: string): Promise<string | null> => {
      const task = await taskService.getById(id);
      if (!task) return null;
      let recurringId: string | null = null;
      if (task.is_completed) {
        await taskService.noncomplete(id);
      } else {
        const { recurring } = await taskService.complete(id);
        recurringId = recurring?.id ?? null;
      }
      await onReload();
      schedulePush();
      return recurringId;
    },
    [taskService, onReload, schedulePush],
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await taskService.update(id, changes);
      await onReload();
      schedulePush();
    },
    [taskService, onReload, schedulePush],
  );

  const moveTask = useCallback(
    async (id: string, box: Box) => {
      await taskService.moveToBox(id, box);
      await onReload();
      schedulePush();
    },
    [taskService, onReload, schedulePush],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.softDelete(id);
      await onReload();
      schedulePush();
    },
    [taskService, onReload, schedulePush],
  );

  return { completeTask, updateTask, moveTask, deleteTask };
}
