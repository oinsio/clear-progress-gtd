import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { defaultTaskService } from "@/services/defaultServices";
import { useSync } from "@/app/providers/SyncProvider";

export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (title: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  reorderTasks: (orderedTasks: Task[]) => Promise<void>;
  reload: () => Promise<void>;
}

export function useTasks(
  box: Box,
  taskService: TaskService = defaultTaskService,
): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { syncVersion, schedulePush } = useSync();

  const loadTasks = useCallback(async () => {
    const boxTasks = await taskService.getByBox(box);
    setTasks(boxTasks);
    setIsLoading(false);
  }, [taskService, box]);

  useEffect(() => {
    setIsLoading(true);
    void loadTasks();
  }, [loadTasks, syncVersion]);

  const createTask = useCallback(
    async (title: string) => {
      await taskService.create({ title, box });
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, box, schedulePush],
  );

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
      await loadTasks();
      schedulePush();
      return recurringId;
    },
    [taskService, loadTasks, schedulePush],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.softDelete(id);
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, schedulePush],
  );

  const moveTask = useCallback(
    async (id: string, targetBox: Box) => {
      await taskService.moveToBox(id, targetBox);
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, schedulePush],
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await taskService.update(id, changes);
      await loadTasks();
      schedulePush();
    },
    [taskService, loadTasks, schedulePush],
  );

  const reorderTasks = useCallback(
    async (orderedTasks: Task[]) => {
      setTasks(orderedTasks);
      await taskService.reorderTasks(orderedTasks);
      schedulePush();
    },
    [taskService, schedulePush],
  );

  return { tasks, isLoading, createTask, completeTask, deleteTask, moveTask, updateTask, reorderTasks, reload: loadTasks };
}
