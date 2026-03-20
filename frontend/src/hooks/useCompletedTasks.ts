import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { defaultTaskService } from "@/services/defaultServices";
import { useSync } from "@/app/providers/SyncProvider";

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
  const { syncVersion } = useSync();

  const reload = useCallback(async () => {
    const tasks = await taskService.getCompleted();
    setCompletedTasks(tasks);
    setIsLoading(false);
  }, [taskService]);

  useEffect(() => {
    void reload();
  }, [reload, syncVersion]);

  return { completedTasks, isLoading, reload };
}
