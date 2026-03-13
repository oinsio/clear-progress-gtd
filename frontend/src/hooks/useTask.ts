import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

const defaultTaskService = new TaskService(new TaskRepository());

export interface UseTaskReturn {
  task: Task | undefined;
  isLoading: boolean;
  updateTask: (changes: Partial<Task>) => Promise<void>;
  completeTask: () => Promise<void>;
  deleteTask: () => Promise<void>;
  moveTask: (box: Box) => Promise<void>;
}

export function useTask(
  id: string,
  taskService: TaskService = defaultTaskService,
): UseTaskReturn {
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const loadTask = useCallback(async () => {
    const foundTask = await taskService.getById(id);
    setTask(foundTask);
    setIsLoading(false);
  }, [taskService, id]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const updateTask = useCallback(
    async (changes: Partial<Task>) => {
      if (!task) return;
      await taskService.update(task.id, changes);
      await loadTask();
    },
    [taskService, task, loadTask],
  );

  const completeTask = useCallback(async () => {
    if (!task) return;
    await taskService.complete(task.id);
    await loadTask();
  }, [taskService, task, loadTask]);

  const deleteTask = useCallback(async () => {
    if (!task) return;
    await taskService.softDelete(task.id);
  }, [taskService, task]);

  const moveTask = useCallback(
    async (box: Box) => {
      if (!task) return;
      await taskService.moveToBox(task.id, box);
      await loadTask();
    },
    [taskService, task, loadTask],
  );

  return { task, isLoading, updateTask, completeTask, deleteTask, moveTask };
}
