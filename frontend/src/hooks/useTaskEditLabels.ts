import { useTranslation } from "react-i18next";
import type { Goal, Context, Category } from "@/types/entities";
import { resolveEntityTitle, resolveEntityName } from "@/components/tasks/taskEditShared";

interface ChecklistProgress {
  completed: number;
  total: number;
}

interface TaskEditLabels {
  selectedGoalTitle: string;
  selectedContextName: string;
  selectedCategoryName: string;
  checklistTabLabel: string;
}

export function useTaskEditLabels(
  selectedGoalId: string,
  selectedContextId: string,
  selectedCategoryId: string,
  goals: Goal[],
  contexts: Context[],
  categories: Category[],
  progress: ChecklistProgress,
): TaskEditLabels {
  const { t } = useTranslation();

  const selectedGoalTitle = resolveEntityTitle(selectedGoalId, goals, t("selector.noGoal"));
  const selectedContextName = resolveEntityName(selectedContextId, contexts, t("selector.noContext"));
  const selectedCategoryName = resolveEntityName(selectedCategoryId, categories, t("selector.noCategory"));
  const checklistTabLabel =
    progress.total > 0
      ? t("taskEdit.tabChecklistProgress", { completed: progress.completed, total: progress.total })
      : t("taskEdit.tabChecklist");

  return { selectedGoalTitle, selectedContextName, selectedCategoryName, checklistTabLabel };
}
