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
  completeTask: (id: string) => Promise<void>;
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
  const { syncVersion } = useSync();

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
    },
    [taskService, loadTasks, box],
  );

  const completeTask = useCallback(
    async (id: string) => {
      const task = await taskService.getById(id);
      if (!task) return;
      if (task.is_completed) {
        await taskService.noncomplete(id);
      } else {
        await taskService.complete(id);
      }
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.softDelete(id);
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  const moveTask = useCallback(
    async (id: string, targetBox: Box) => {
      await taskService.moveToBox(id, targetBox);
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await taskService.update(id, changes);
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  const reorderTasks = useCallback(
    async (orderedTasks: Task[]) => {
      setTasks(orderedTasks);
      await taskService.reorderTasks(orderedTasks);
    },
    [taskService],
  );

  return { tasks, isLoading, createTask, completeTask, deleteTask, moveTask, updateTask, reorderTasks, reload: loadTasks };
}
