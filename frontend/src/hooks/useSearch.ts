import { useState, useCallback } from "react";
import type { Task, Goal } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { GoalService } from "@/services/GoalService";
import { defaultTaskService, defaultGoalService } from "@/services/defaultServices";

export interface UseSearchReturn {
  tasks: Task[];
  goals: Goal[];
  isSearching: boolean;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useSearch(
  taskService: TaskService = defaultTaskService,
  goalService: GoalService = defaultGoalService,
): UseSearchReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!query) {
        setTasks([]);
        setGoals([]);
        return;
      }
      setIsSearching(true);
      try {
        const [foundTasks, foundGoals] = await Promise.all([
          taskService.searchByTitle(query),
          goalService.searchByTitle(query),
        ]);
        setTasks(foundTasks);
        setGoals(foundGoals);
      } catch (error) {
        console.error("Search failed:", error);
        setTasks([]);
        setGoals([]);
      } finally {
        setIsSearching(false);
      }
    },
    [taskService, goalService],
  );

  const clear = useCallback(() => {
    setTasks([]);
    setGoals([]);
  }, []);

  return { tasks, goals, isSearching, search, clear };
}
