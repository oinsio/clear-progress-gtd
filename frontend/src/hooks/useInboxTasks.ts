import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { defaultTaskService } from "@/services/defaultServices";
import { BOX } from "@/constants";
import { useSync } from "@/app/providers/SyncProvider";

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
  const { syncVersion } = useSync();

  const loadTasks = useCallback(async () => {
    const inboxTasks = await taskService.getByBox(BOX.INBOX);
    setTasks(inboxTasks);
    setIsLoading(false);
  }, [taskService]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks, syncVersion]);

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
