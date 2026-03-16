import { useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";

export interface UseTaskMutationsReturn {
  completeTask: (id: string) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useTaskMutations(
  taskService: TaskService,
  onReload: () => Promise<void>,
): UseTaskMutationsReturn {
  const completeTask = useCallback(
    async (id: string) => {
      const task = await taskService.getById(id);
      if (!task) return;
      if (task.is_completed) {
        await taskService.noncomplete(id);
      } else {
        await taskService.complete(id);
      }
      await onReload();
    },
    [taskService, onReload],
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await taskService.update(id, changes);
      await onReload();
    },
    [taskService, onReload],
  );

  const moveTask = useCallback(
    async (id: string, box: Box) => {
      await taskService.moveToBox(id, box);
      await onReload();
    },
    [taskService, onReload],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.softDelete(id);
      await onReload();
    },
    [taskService, onReload],
  );

  return { completeTask, updateTask, moveTask, deleteTask };
}
