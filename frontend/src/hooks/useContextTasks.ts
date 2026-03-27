import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useTaskMutations } from "./useTaskMutations";

const defaultTaskService = new TaskService(new TaskRepository(), new ChecklistRepository());

export interface UseContextTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (title: string, box: Box, notes?: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useContextTasks(
  contextId: string,
  taskService: TaskService = defaultTaskService,
): UseContextTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const contextTasks = await taskService.getByContextId(contextId);
    setTasks(contextTasks);
    setIsLoading(false);
  }, [taskService, contextId]);

  useEffect(() => {
    setIsLoading(true);
    void loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(
    async (title: string, box: Box, notes = "") => {
      await taskService.create({ title, box, notes, context_id: contextId });
      await loadTasks();
    },
    [taskService, loadTasks, contextId],
  );

  const mutations = useTaskMutations(taskService, loadTasks);

  return { tasks, isLoading, createTask, ...mutations };
}
