import { useState, useEffect, useCallback } from "react";
import type { Goal } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { GoalService } from "@/services/GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultGoalService = new GoalService(new GoalRepository());

export interface UseGoalsReturn {
  goals: Goal[];
  isLoading: boolean;
  reloadGoals: () => Promise<void>;
  createGoal: (data: Pick<Goal, "title"> & Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, changes: Partial<Goal>) => Promise<void>;
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  reorderGoals: (orderedGoals: Goal[]) => Promise<void>;
}

export function useGoals(
  goalService: GoalService = defaultGoalService,
): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { syncVersion, schedulePush } = useSync();

  const loadGoals = useCallback(async () => {
    const allGoals = await goalService.getAll();
    setGoals(allGoals);
    setIsLoading(false);
  }, [goalService]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals, syncVersion]);

  const createGoal = useCallback(
    async (data: Pick<Goal, "title"> & Partial<Goal>) => {
      await goalService.create(data);
      await loadGoals();
      schedulePush();
    },
    [goalService, loadGoals, schedulePush],
  );

  const updateGoal = useCallback(
    async (id: string, changes: Partial<Goal>) => {
      await goalService.update(id, changes);
      await loadGoals();
      schedulePush();
    },
    [goalService, loadGoals, schedulePush],
  );

  const updateGoalStatus = useCallback(
    async (id: string, status: GoalStatus) => {
      await goalService.updateStatus(id, status);
      await loadGoals();
      schedulePush();
    },
    [goalService, loadGoals, schedulePush],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await goalService.softDelete(id);
      await loadGoals();
      schedulePush();
    },
    [goalService, loadGoals, schedulePush],
  );

  const reorderGoals = useCallback(
    async (orderedGoals: Goal[]) => {
      await goalService.reorderGoals(orderedGoals);
      await loadGoals();
      schedulePush();
    },
    [goalService, loadGoals, schedulePush],
  );

  return { goals, isLoading, reloadGoals: loadGoals, createGoal, updateGoal, updateGoalStatus, deleteGoal, reorderGoals };
}
