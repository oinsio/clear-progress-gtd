import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

const defaultTaskService = new TaskService(new TaskRepository());

export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
}

export function useTasks(
  box: Box,
  taskService: TaskService = defaultTaskService,
): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const boxTasks = await taskService.getByBox(box);
    setTasks(boxTasks);
    setIsLoading(false);
  }, [taskService, box]);

  useEffect(() => {
    setIsLoading(true);
    void loadTasks();
  }, [loadTasks]);

  const completeTask = useCallback(
    async (id: string) => {
      await taskService.complete(id);
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

  return { tasks, isLoading, completeTask, deleteTask, moveTask };
}
