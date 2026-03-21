import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, Plus } from "lucide-react";
import { useCategoryTasks } from "@/hooks/useCategoryTasks";
import { useCategories } from "@/hooks/useCategories";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { TaskCreateSheet } from "@/components/tasks/TaskCreateSheet";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { EntityEditSheet } from "@/components/EntityEditSheet";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { BOX, ROUTES } from "@/constants";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";

const CATEGORY_NOT_FOUND_MESSAGE = "Категория не найдена";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { categories, updateCategory, deleteCategory } = useCategories();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { panelSide } = usePanelSide();
  const { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask } =
    useCategoryTasks(id ?? "");

  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isCreateTaskSheetOpen, setIsCreateTaskSheetOpen] = useState(false);

  const category = useMemo(
    () => categories.find((c) => c.id === id && !c.is_deleted),
    [categories, id],
  );

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
        <p className="text-gray-400 text-sm">{CATEGORY_NOT_FOUND_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div data-testid="category-detail-page" className="relative flex h-screen overflow-hidden bg-white">
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label="Назад"
            onClick={() => navigate(ROUTES.CATEGORIES)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-accent">Категория</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Category card */}
          {category && (
            <button
              type="button"
              data-testid="category-card"
              onClick={() => setIsEditSheetOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-accent" />
              </div>
              <span className="text-gray-800 font-medium">{category.name}</span>
            </button>
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
            aria-label="Добавить задачу"
            data-testid="add-task-button"
            onClick={() => setIsCreateTaskSheetOpen(true)}
            className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Category edit sheet */}
        {isEditSheetOpen && category && (
          <EntityEditSheet
            testId="category-edit-sheet"
            title="Редактировать категорию"
            initialName={category.name}
            namePlaceholder="Название категории"
            deleteLabel="Удалить категорию"
            nameInputTestId="category-edit-name-input"
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
            onClose={() => setIsEditSheetOpen(false)}
          />
        )}

        {/* Task create sheet */}
        {isCreateTaskSheetOpen && category && (
          <TaskCreateSheet
            entityLabel="Категория"
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
