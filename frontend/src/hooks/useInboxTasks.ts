import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { BOX } from "@/constants";

const defaultTaskService = new TaskService(new TaskRepository());

export interface UseInboxTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useInboxTasks(
  taskService: TaskService = defaultTaskService,
): UseInboxTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const inboxTasks = await taskService.getByBox(BOX.INBOX);
    setTasks(inboxTasks);
    setIsLoading(false);
  }, [taskService]);

  useEffect(() => {
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

  return { tasks, isLoading, completeTask, deleteTask };
}
