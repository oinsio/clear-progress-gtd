import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Tag, Plus, Pencil, Check, Trash2 } from "lucide-react";
import { useCategoryTasks } from "@/hooks/useCategoryTasks";
import { useCategories } from "@/hooks/useCategories";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { TaskCreateSheet } from "@/components/tasks/TaskCreateSheet";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { BOX, ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoryDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { categories, updateCategory, deleteCategory } = useCategories();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { panelSide } = usePanelSide();
  const { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask } =
    useCategoryTasks(id ?? "");

  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateTaskSheetOpen, setIsCreateTaskSheetOpen] = useState(false);

  const category = useMemo(
    () => categories.find((c) => c.id === id && !c.is_deleted),
    [categories, id],
  );

  const isUnsynced = useIsUnsynced(category ?? { updated_at: "" });

  const tasksByBox = useMemo(() => {
    const grouped: Record<Box, Task[]> = {
      [BOX.INBOX]: [],
      [BOX.TODAY]: [],
      [BOX.WEEK]: [],
      [BOX.LATER]: [],
    };
    for (const task of tasks) {
      grouped[task.box].push(task);
    }
    return grouped;
  }, [tasks]);

  const handleSaveCategory = useCallback(
    async (name: string) => {
      if (!id) return;
      await updateCategory(id, name);
    },
    [id, updateCategory],
  );

  const handleDeleteCategory = useCallback(async () => {
    if (!id) return;
    await deleteCategory(id);
    navigate(ROUTES.CATEGORIES);
  }, [id, deleteCategory, navigate]);

  const handleStartEdit = useCallback(() => {
    setEditName(category?.name ?? "");
    setIsEditing(true);
  }, [category]);

  const handleConfirmEdit = useCallback(async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    await handleSaveCategory(trimmedName);
    setIsEditing(false);
  }, [editName, handleSaveCategory]);

  const handleCancelEdit = useCallback(() => setIsEditing(false), []);

  const handleCreateTask = useCallback(
    async (title: string, box: Box, notes: string) => {
      await createTask(title, box, notes);
    },
    [createTask],
  );

  const handlePanelToggle = togglePanelOpen;

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  if (!isLoading && !category) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{t("category.notFound")}</p>
      </div>
    );
  }

  return (
    <div data-testid="category-detail-page" className="relative flex flex-1 overflow-hidden bg-white">
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label={t("category.back")}
            onClick={() => navigate(ROUTES.CATEGORIES)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-accent">{t("selector.category")}</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Category card */}
          {category && (
            <div
              data-testid="category-card"
              className={cn(
                "flex items-center gap-3 px-4 py-4 border-b border-gray-100 border-l-2 transition-colors",
                isUnsynced ? "border-l-amber-400" : "border-l-transparent",
              )}
            >
              {isEditing && (
                <button
                  type="button"
                  aria-label={t("category.deleteLabel")}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  data-testid="category-delete-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-accent" />
              </div>

              {isEditing ? (
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleConfirmEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="flex-1 text-gray-800 font-medium text-sm border-b border-accent outline-none bg-transparent"
                  data-testid="category-name-input"
                />
              ) : (
                <span className="flex-1 text-gray-800 font-medium">{category.name}</span>
              )}

              {isEditing ? (
                <button
                  type="button"
                  aria-label={t("category.saveName")}
                  onClick={() => void handleConfirmEdit()}
                  disabled={!editName.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
                  data-testid="category-save-btn"
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={t("category.editName")}
                  onClick={handleStartEdit}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  data-testid="category-edit-btn"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Task content */}
          <BoxSectionList
            isLoading={isLoading}
            tasksByBox={tasksByBox}
            goals={goals}
            contexts={contexts}
            categories={categories}
            onAddPromptClick={() => setIsCreateTaskSheetOpen(true)}
            onComplete={completeTask}
            onUpdate={updateTask}
            onMove={moveTask}
            onDelete={deleteTask}
          />
        </main>

        {/* Bottom action bar */}
        <div className="flex items-center justify-end border-t border-gray-200 bg-white px-3 py-2">
          <button
            type="button"
            aria-label={t("task.add")}
            data-testid="add-task-button"
            onClick={() => setIsCreateTaskSheetOpen(true)}
            className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Delete confirmation dialog */}
        {isDeleteConfirmOpen && category && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteConfirmOpen(false)} />
            <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
              <p className="text-base font-semibold text-gray-900 mb-2">{t("category.deleteLabel")}?</p>
              <p className="text-sm text-gray-500 mb-6">{category.name}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  data-testid="category-delete-cancel-btn"
                >
                  {t("task.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteCategory()}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                  data-testid="category-delete-confirm-btn"
                >
                  {t("taskEdit.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task create sheet */}
        {isCreateTaskSheetOpen && category && (
          <TaskCreateSheet
            entityLabel={t("selector.category")}
            entityName={category.name}
            entityIcon={Tag}
            onSave={handleCreateTask}
            onClose={() => setIsCreateTaskSheetOpen(false)}
          />
        )}
      </div>

      {/* Right filter panel — full height */}
      <RightFilterPanel
        mode="categories"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
