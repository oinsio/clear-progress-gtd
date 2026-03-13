import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

const defaultTaskService = new TaskService(new TaskRepository());

export interface UseCompletedTasksReturn {
  completedTasks: Task[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useCompletedTasks(
  taskService: TaskService = defaultTaskService,
): UseCompletedTasksReturn {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const tasks = await taskService.getCompleted();
    setCompletedTasks(tasks);
    setIsLoading(false);
  }, [taskService]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { completedTasks, isLoading, reload };
}
