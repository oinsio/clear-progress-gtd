import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useTaskMutations } from "./useTaskMutations";

const defaultTaskService = new TaskService(new TaskRepository(), new ChecklistRepository());

export interface UseGoalTasksReturn {
  tasks: Task[];
  completedTasks: Task[];
  isLoading: boolean;
  createTask: (title: string, box: Box, notes?: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useGoalTasks(
  goalId: string,
  taskService: TaskService = defaultTaskService,
): UseGoalTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const allGoalTasks = await taskService.getByGoalId(goalId);
    setTasks(allGoalTasks.filter((task) => !task.is_completed));
    setCompletedTasks(
      allGoalTasks
        .filter((task) => task.is_completed)
        .sort((taskA, taskB) => {
          if (taskA.completed_at && taskB.completed_at) {
            return taskB.completed_at.localeCompare(taskA.completed_at);
          }
          return taskB.sort_order - taskA.sort_order;
        }),
    );
    setIsLoading(false);
  }, [taskService, goalId]);

  useEffect(() => {
    setIsLoading(true);
    void loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(
    async (title: string, box: Box, notes = "") => {
      await taskService.create({ title, box, notes, goal_id: goalId });
      await loadTasks();
    },
    [taskService, loadTasks, goalId],
  );

  const mutations = useTaskMutations(taskService, loadTasks);

  return { tasks, completedTasks, isLoading, createTask, ...mutations };
}
