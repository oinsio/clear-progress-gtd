import { useState, useEffect, useCallback } from "react";
import type { Goal } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { GoalService } from "@/services/GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";

const defaultGoalService = new GoalService(new GoalRepository());

export interface UseGoalsReturn {
  goals: Goal[];
  isLoading: boolean;
  reloadGoals: () => Promise<void>;
  createGoal: (data: Pick<Goal, "title"> & Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, changes: Partial<Goal>) => Promise<void>;
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export function useGoals(
  goalService: GoalService = defaultGoalService,
): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    const allGoals = await goalService.getAll();
    setGoals(allGoals);
    setIsLoading(false);
  }, [goalService]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const createGoal = useCallback(
    async (data: Pick<Goal, "title"> & Partial<Goal>) => {
      await goalService.create(data);
      await loadGoals();
    },
    [goalService, loadGoals],
  );

  const updateGoal = useCallback(
    async (id: string, changes: Partial<Goal>) => {
      await goalService.update(id, changes);
      await loadGoals();
    },
    [goalService, loadGoals],
  );

  const updateGoalStatus = useCallback(
    async (id: string, status: GoalStatus) => {
      await goalService.updateStatus(id, status);
      await loadGoals();
    },
    [goalService, loadGoals],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await goalService.softDelete(id);
      await loadGoals();
    },
    [goalService, loadGoals],
  );

  return { goals, isLoading, reloadGoals: loadGoals, createGoal, updateGoal, updateGoalStatus, deleteGoal };
}
