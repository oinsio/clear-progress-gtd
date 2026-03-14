import { useState, useEffect, useCallback } from "react";
import type { Goal, Task } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { GoalService } from "@/services/GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { TaskService } from "@/services/TaskService";
import { defaultTaskService } from "@/services/defaultServices";

const defaultGoalService = new GoalService(new GoalRepository());

export interface UseGoalReturn {
  goal: Goal | undefined;
  tasks: Task[];
  isLoading: boolean;
  updateGoal: (changes: Partial<Goal>) => Promise<void>;
  updateGoalStatus: (status: GoalStatus) => Promise<void>;
  deleteGoal: () => Promise<void>;
}

export function useGoal(
  id: string,
  goalService: GoalService = defaultGoalService,
  taskService: TaskService = defaultTaskService,
): UseGoalReturn {
  const [goal, setGoal] = useState<Goal | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGoal = useCallback(async () => {
    const [foundGoal, goalTasks] = await Promise.all([
      goalService.getById(id),
      taskService.getByGoalId(id),
    ]);
    setGoal(foundGoal);
    setTasks(goalTasks);
    setIsLoading(false);
  }, [goalService, taskService, id]);

  useEffect(() => {
    void loadGoal();
  }, [loadGoal]);

  const updateGoal = useCallback(
    async (changes: Partial<Goal>) => {
      if (!goal) return;
      await goalService.update(goal.id, changes);
      await loadGoal();
    },
    [goalService, goal, loadGoal],
  );

  const updateGoalStatus = useCallback(
    async (status: GoalStatus) => {
      if (!goal) return;
      await goalService.updateStatus(goal.id, status);
      await loadGoal();
    },
    [goalService, goal, loadGoal],
  );

  const deleteGoal = useCallback(async () => {
    if (!goal) return;
    await goalService.softDelete(goal.id);
  }, [goalService, goal]);

  return { goal, tasks, isLoading, updateGoal, updateGoalStatus, deleteGoal };
}
