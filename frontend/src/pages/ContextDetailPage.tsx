import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { useContextTasks } from "@/hooks/useContextTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useCategories } from "@/hooks/useCategories";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { TaskCreateSheet } from "@/components/tasks/TaskCreateSheet";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { EntityEditSheet } from "@/components/EntityEditSheet";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { BOX, ROUTES } from "@/constants";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TodayBoxIcon, WeekBoxIcon, LaterBoxIcon } from "@/components/tasks/BoxIcons";
import * as React from "react";

const CONTEXT_NOT_FOUND_MESSAGE = "Контекст не найден";

const BOX_SECTION_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }) => <MapPin className={className} />,
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContextDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { contexts, updateContext, deleteContext } = useContexts();
  const { goals } = useGoals();
  const { categories } = useCategories();
  const { panelSide } = usePanelSide();
  const { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask } =
    useContextTasks(id ?? "");

  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isCreateTaskSheetOpen, setIsCreateTaskSheetOpen] = useState(false);

  const context = useMemo(
    () => contexts.find((c) => c.id === id && !c.is_deleted),
    [contexts, id],
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

  const handleSaveContext = useCallback(
    async (name: string) => {
      if (!id) return;
      await updateContext(id, name);
    },
    [id, updateContext],
  );

  const handleDeleteContext = useCallback(async () => {
    if (!id) return;
    await deleteContext(id);
    navigate(ROUTES.CONTEXTS);
  }, [id, deleteContext, navigate]);

  const handleCreateTask = useCallback(
    async (title: string, box: Box, notes: string) => {
      await createTask(title, box, notes);
    },
    [createTask],
  );

  const handlePanelToggle = togglePanelOpen;

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "categories") navigate(ROUTES.CATEGORIES);
      else if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  if (!isLoading && !context) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{CONTEXT_NOT_FOUND_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div data-testid="context-detail-page" className="flex h-screen overflow-hidden bg-white">
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label="Назад"
            onClick={() => navigate(ROUTES.CONTEXTS)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-accent">Контекст</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Context card */}
          {context && (
            <button
              type="button"
              data-testid="context-card"
              onClick={() => setIsEditSheetOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <span className="text-gray-800 font-medium">{context.name}</span>
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

        {/* Context edit sheet */}
        {isEditSheetOpen && context && (
          <EntityEditSheet
            testId="context-edit-sheet"
            title="Редактировать контекст"
            initialName={context.name}
            namePlaceholder="Название контекста"
            deleteLabel="Удалить контекст"
            nameInputTestId="context-edit-name-input"
            onSave={handleSaveContext}
            onDelete={handleDeleteContext}
            onClose={() => setIsEditSheetOpen(false)}
          />
        )}

        {/* Task create sheet */}
        {isCreateTaskSheetOpen && context && (
          <TaskCreateSheet
            entityLabel="Контекст"
            entityName={context.name}
            entityIcon={BOX_SECTION_ICONS[BOX.INBOX]}
            onSave={handleCreateTask}
            onClose={() => setIsCreateTaskSheetOpen(false)}
          />
        )}
      </div>

      {/* Right filter panel */}
      <RightFilterPanel
        mode="contexts"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
