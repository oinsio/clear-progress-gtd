import { useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useContextTasks } from "@/hooks/useContextTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useCategories } from "@/hooks/useCategories";
import { EntityDetailLayout } from "@/components/tasks/EntityDetailLayout";
import { type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { ROUTES } from "@/constants";

const CONTEXT_I18N_KEYS = {
  back: "context.back",
  title: "selector.context",
  notFound: "context.notFound",
  deleteLabel: "context.deleteLabel",
  editName: "context.editName",
  saveName: "context.saveName",
} as const;

export default function ContextDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { contexts, updateContext, deleteContext } = useContexts();
  const { goals } = useGoals();
  const { categories } = useCategories();
  const { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask } =
    useContextTasks(id ?? "");

  const context = useMemo(
    () => contexts.find((c) => c.id === id && !c.is_deleted),
    [contexts, id],
  );

  const handleSaveEntity = useCallback(
    async (name: string) => {
      if (!id) return;
      await updateContext(id, name);
    },
    [id, updateContext],
  );

  const handleDeleteEntity = useCallback(async () => {
    if (!id) return;
    await deleteContext(id);
    navigate(ROUTES.CONTEXTS);
  }, [id, deleteContext, navigate]);

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "categories") navigate(ROUTES.CATEGORIES);
      else if (newMode === "inbox" || newMode === "tasks" || newMode === "completed")
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  return (
    <EntityDetailLayout
      entity={context}
      isLoading={isLoading}
      tasks={tasks}
      goals={goals}
      contexts={contexts}
      categories={categories}
      icon={MapPin}
      panelMode="contexts"
      backRoute={ROUTES.CONTEXTS}
      testIdPrefix="context"
      i18nKeys={CONTEXT_I18N_KEYS}
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
