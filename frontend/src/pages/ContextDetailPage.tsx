import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Plus, Pencil, Check, Trash2 } from "lucide-react";
import { useContextTasks } from "@/hooks/useContextTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useCategories } from "@/hooks/useCategories";
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
import { TodayBoxIcon, WeekBoxIcon, LaterBoxIcon } from "@/components/tasks/BoxIcons";
import * as React from "react";

const BOX_SECTION_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }) => <MapPin className={className} />,
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContextDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { contexts, updateContext, deleteContext } = useContexts();
  const { goals } = useGoals();
  const { categories } = useCategories();
  const { panelSide } = usePanelSide();
  const { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask } =
    useContextTasks(id ?? "");

  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateTaskSheetOpen, setIsCreateTaskSheetOpen] = useState(false);

  const context = useMemo(
    () => contexts.find((c) => c.id === id && !c.is_deleted),
    [contexts, id],
  );

  const isUnsynced = useIsUnsynced(context ?? { updated_at: "" });

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

  const handleStartEdit = useCallback(() => {
    setEditName(context?.name ?? "");
    setIsEditing(true);
  }, [context]);

  const handleConfirmEdit = useCallback(async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    await handleSaveContext(trimmedName);
    setIsEditing(false);
  }, [editName, handleSaveContext]);

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
      if (newMode === "categories") navigate(ROUTES.CATEGORIES);
      else if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  if (!isLoading && !context) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{t("context.notFound")}</p>
      </div>
    );
  }

  return (
    <div data-testid="context-detail-page" className="relative flex flex-1 overflow-hidden bg-white">
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label={t("context.back")}
            onClick={() => navigate(ROUTES.CONTEXTS)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-accent">{t("selector.context")}</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Context card */}
          {context && (
            <div
              data-testid="context-card"
              className={cn(
                "flex items-center gap-3 px-4 py-4 border-b border-gray-100 border-l-2 transition-colors",
                isUnsynced ? "border-l-amber-400" : "border-l-transparent",
              )}
            >
              {isEditing && (
                <button
                  type="button"
                  aria-label={t("context.deleteLabel")}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  data-testid="context-delete-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-accent" />
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
                  data-testid="context-name-input"
                />
              ) : (
                <span className="flex-1 text-gray-800 font-medium">{context.name}</span>
              )}

              {isEditing ? (
                <button
                  type="button"
                  aria-label={t("context.saveName")}
                  onClick={() => void handleConfirmEdit()}
                  disabled={!editName.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
                  data-testid="context-save-btn"
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={t("context.editName")}
                  onClick={handleStartEdit}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  data-testid="context-edit-btn"
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
        {isDeleteConfirmOpen && context && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteConfirmOpen(false)} />
            <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
              <p className="text-base font-semibold text-gray-900 mb-2">{t("context.deleteLabel")}?</p>
              <p className="text-sm text-gray-500 mb-6">{context.name}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  data-testid="context-delete-cancel-btn"
                >
                  {t("task.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteContext()}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                  data-testid="context-delete-confirm-btn"
                >
                  {t("taskEdit.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task create sheet */}
        {isCreateTaskSheetOpen && context && (
          <TaskCreateSheet
            entityLabel={t("selector.context")}
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
