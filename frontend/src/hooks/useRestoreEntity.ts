import { useCallback } from "react";
import { TaskService } from "@/services/TaskService";
import { GoalService } from "@/services/GoalService";
import { ContextService } from "@/services/ContextService";
import { CategoryService } from "@/services/CategoryService";
import { ChecklistService } from "@/services/ChecklistService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultTaskService = new TaskService(new TaskRepository(), new ChecklistRepository());
const defaultGoalService = new GoalService(new GoalRepository());
const defaultContextService = new ContextService(new ContextRepository());
const defaultCategoryService = new CategoryService(new CategoryRepository());
const defaultChecklistService = new ChecklistService(new ChecklistRepository());

export interface UseRestoreEntityReturn {
  restoreTask: (id: string) => Promise<void>;
  restoreGoal: (id: string) => Promise<void>;
  restoreContext: (id: string) => Promise<void>;
  restoreCategory: (id: string) => Promise<void>;
  restoreChecklistItem: (id: string) => Promise<void>;
}

export function useRestoreEntity(
  reload: () => Promise<void>,
): UseRestoreEntityReturn {
  const { schedulePush } = useSync();

  const restoreTask = useCallback(
    async (id: string) => {
      await defaultTaskService.restore(id);
      schedulePush();
      await reload();
    },
    [reload, schedulePush],
  );

  const restoreGoal = useCallback(
    async (id: string) => {
      await defaultGoalService.restore(id);
      schedulePush();
      await reload();
    },
    [reload, schedulePush],
  );

  const restoreContext = useCallback(
    async (id: string) => {
      await defaultContextService.restore(id);
      schedulePush();
      await reload();
    },
    [reload, schedulePush],
  );

  const restoreCategory = useCallback(
    async (id: string) => {
      await defaultCategoryService.restore(id);
      schedulePush();
      await reload();
    },
    [reload, schedulePush],
  );

  const restoreChecklistItem = useCallback(
    async (id: string) => {
      await defaultChecklistService.restore(id);
      schedulePush();
      await reload();
    },
    [reload, schedulePush],
  );

  return {
    restoreTask,
    restoreGoal,
    restoreContext,
    restoreCategory,
    restoreChecklistItem,
  };
}
