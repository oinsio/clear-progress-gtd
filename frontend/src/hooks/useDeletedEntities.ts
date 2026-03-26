import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/database";
import type { Task, Goal, Context, Category, ChecklistItem } from "@/types/entities";
import { useSync } from "@/app/providers/SyncProvider";

export interface DeletedEntities {
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  checklistItems: ChecklistItem[];
  taskTitleMap: Map<string, string>;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useDeletedEntities(): DeletedEntities {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [taskTitleMap, setTaskTitleMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { syncVersion } = useSync();

  const load = useCallback(async () => {
    const [
      deletedTasks,
      deletedGoals,
      deletedContexts,
      deletedCategories,
      deletedChecklistItems,
      allTasks,
    ] = await Promise.all([
      db.tasks.filter((task) => task.is_deleted).toArray(),
      db.goals.filter((goal) => goal.is_deleted).toArray(),
      db.contexts.filter((ctx) => ctx.is_deleted).toArray(),
      db.categories.filter((cat) => cat.is_deleted).toArray(),
      db.checklist_items.filter((item) => item.is_deleted).toArray(),
      db.tasks.toArray(),
    ]);

    const newTaskTitleMap = new Map<string, string>(
      allTasks.map((task) => [task.id, task.title]),
    );

    setTasks(deletedTasks);
    setGoals(deletedGoals);
    setContexts(deletedContexts);
    setCategories(deletedCategories);
    setChecklistItems(deletedChecklistItems);
    setTaskTitleMap(newTaskTitleMap);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, syncVersion]);

  return {
    tasks,
    goals,
    contexts,
    categories,
    checklistItems,
    taskTitleMap,
    isLoading,
    reload: load,
  };
}
