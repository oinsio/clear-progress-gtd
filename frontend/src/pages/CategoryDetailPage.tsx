import { useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tag } from "lucide-react";
import { useCategoryTasks } from "@/hooks/useCategoryTasks";
import { useCategories } from "@/hooks/useCategories";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { EntityDetailLayout } from "@/components/tasks/EntityDetailLayout";
import { type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { ROUTES } from "@/constants";

const CATEGORY_I18N_KEYS = {
  back: "category.back",
  title: "selector.category",
  notFound: "category.notFound",
  deleteLabel: "category.deleteLabel",
  editName: "category.editName",
  saveName: "category.saveName",
} as const;

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { categories, updateCategory, deleteCategory } = useCategories();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask } =
    useCategoryTasks(id ?? "");

  const category = useMemo(
    () => categories.find((c) => c.id === id && !c.is_deleted),
    [categories, id],
  );

  const handleSaveEntity = useCallback(
    async (name: string) => {
      if (!id) return;
      await updateCategory(id, name);
    },
    [id, updateCategory],
  );

  const handleDeleteEntity = useCallback(async () => {
    if (!id) return;
    await deleteCategory(id);
    navigate(ROUTES.CATEGORIES);
  }, [id, deleteCategory, navigate]);

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "inbox" || newMode === "tasks" || newMode === "completed")
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  return (
    <EntityDetailLayout
      entity={category}
      isLoading={isLoading}
      tasks={tasks}
      goals={goals}
      contexts={contexts}
      categories={categories}
      icon={Tag}
      panelMode="categories"
      backRoute={ROUTES.CATEGORIES}
      testIdPrefix="category"
      i18nKeys={CATEGORY_I18N_KEYS}
      onSaveEntity={handleSaveEntity}
      onDeleteEntity={handleDeleteEntity}
      onCreateTask={createTask}
      onCompleteTask={completeTask}
      onUpdateTask={updateTask}
      onMoveTask={moveTask}
      onDeleteTask={deleteTask}
      onModeChange={handleModeChange}
    />
  );
}
