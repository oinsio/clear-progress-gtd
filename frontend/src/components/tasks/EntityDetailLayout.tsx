import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Pencil, Check, Trash2 } from "lucide-react";
import type { ComponentType } from "react";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { TaskCreateSheet } from "@/components/tasks/TaskCreateSheet";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { BOX } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Task, Goal, Context, Category } from "@/types/entities";
import type { Box } from "@/types/common";

interface EntityDetailLayoutI18nKeys {
  back: string;
  title: string;
  notFound: string;
  deleteLabel: string;
  editName: string;
  saveName: string;
}

export interface EntityDetailLayoutProps {
  entity: { name: string; updated_at: string } | undefined;
  isLoading: boolean;
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  icon: ComponentType<{ className?: string }>;
  panelMode: RightPanelMode;
  backRoute: string;
  testIdPrefix: string;
  i18nKeys: EntityDetailLayoutI18nKeys;
  onSaveEntity: (name: string) => Promise<void>;
  onDeleteEntity: () => Promise<void>;
  onCreateTask: (title: string, box: Box, notes: string) => Promise<void>;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  onMoveTask: (id: string, box: Box) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onModeChange: (mode: RightPanelMode) => void;
}

export function EntityDetailLayout({
  entity,
  isLoading,
  tasks,
  goals,
  contexts,
  categories,
  icon: Icon,
  panelMode,
  backRoute,
  testIdPrefix,
  i18nKeys,
  onSaveEntity,
  onDeleteEntity,
  onCreateTask,
  onCompleteTask,
  onUpdateTask,
  onMoveTask,
  onDeleteTask,
  onModeChange,
}: EntityDetailLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const isDesktop = useIsDesktop();
  const { ratio, containerRef: splitContainerRef, handleResizeMouseDown } = usePanelSplit();
  const isUnsynced = useIsUnsynced(entity ?? { updated_at: "" });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateTaskSheetOpen, setIsCreateTaskSheetOpen] = useState(false);

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

  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) ?? null : null),
    [selectedTaskId, tasks],
  );

  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTaskId((previous) => (previous === taskId ? null : taskId));
  }, []);

  const handleDetailPanelClose = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const handleStartEdit = useCallback(() => {
    setEditName(entity?.name ?? "");
    setIsEditing(true);
  }, [entity]);

  const handleConfirmEdit = useCallback(async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    await onSaveEntity(trimmedName);
    setIsEditing(false);
  }, [editName, onSaveEntity]);

  const handleCancelEdit = useCallback(() => setIsEditing(false), []);

  if (!isLoading && !entity) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{t(i18nKeys.notFound)}</p>
      </div>
    );
  }

  return (
    <div data-testid={`${testIdPrefix}-detail-page`} className="relative flex flex-1 overflow-hidden bg-white">
      {/* Split container: task list + optional task detail panel */}
      <div ref={splitContainerRef} className="flex flex-1 overflow-hidden">

      {/* Main content column */}
      <div
        className={cn("flex flex-col overflow-hidden", !isDesktop && selectedTask && "hidden")}
        style={isDesktop && selectedTask ? { width: `${ratio * 100}%`, flexShrink: 0 } : { flex: "1 1 0" }}
      >
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label={t(i18nKeys.back)}
            onClick={() => navigate(backRoute)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-accent">{t(i18nKeys.title)}</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Entity card */}
          {entity && (
            <div
              data-testid={`${testIdPrefix}-card`}
              className={cn(
                "flex items-center gap-3 px-4 py-4 border-b border-gray-100 border-l-2 transition-colors",
                isUnsynced ? "border-l-amber-400" : "border-l-transparent",
              )}
            >
              {isEditing && (
                <button
                  type="button"
                  aria-label={t(i18nKeys.deleteLabel)}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  data-testid={`${testIdPrefix}-delete-btn`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-accent" />
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
                  data-testid={`${testIdPrefix}-name-input`}
                />
              ) : (
                <span className="flex-1 text-gray-800 font-medium">{entity.name}</span>
              )}

              {isEditing ? (
                <button
                  type="button"
                  aria-label={t(i18nKeys.saveName)}
                  onClick={() => void handleConfirmEdit()}
                  disabled={!editName.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
                  data-testid={`${testIdPrefix}-save-btn`}
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={t(i18nKeys.editName)}
                  onClick={handleStartEdit}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  data-testid={`${testIdPrefix}-edit-btn`}
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
            onComplete={onCompleteTask}
            onUpdate={onUpdateTask}
            onMove={onMoveTask}
            onDelete={onDeleteTask}
            onSelect={handleTaskSelect}
            selectedTaskId={selectedTaskId}
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
        {isDeleteConfirmOpen && entity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteConfirmOpen(false)} />
            <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
              <p className="text-base font-semibold text-gray-900 mb-2">{t(i18nKeys.deleteLabel)}?</p>
              <p className="text-sm text-gray-500 mb-6">{entity.name}</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  data-testid={`${testIdPrefix}-delete-cancel-btn`}
                >
                  {t("task.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => void onDeleteEntity()}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                  data-testid={`${testIdPrefix}-delete-confirm-btn`}
                >
                  {t("taskEdit.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task create sheet */}
        {isCreateTaskSheetOpen && entity && (
          <TaskCreateSheet
            entityLabel={t(i18nKeys.title)}
            entityName={entity.name}
            entityIcon={Icon}
            onSave={onCreateTask}
            onClose={() => setIsCreateTaskSheetOpen(false)}
          />
        )}
      </div>

      {/* Resize handle between task list and detail panel */}
      {isDesktop && selectedTask && (
        <div
          className="w-1 flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-accent/30 active:bg-accent/50 transition-colors"
          onMouseDown={handleResizeMouseDown}
        />
      )}

      {/* Task detail panel — shown when a task is selected (desktop: side panel, mobile: full screen) */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          goals={goals}
          contexts={contexts}
          categories={categories}
          onUpdate={onUpdateTask}
          onDelete={(taskId) => {
            setSelectedTaskId(null);
            void onDeleteTask(taskId);
          }}
          onClose={handleDetailPanelClose}
          style={isDesktop ? { width: `${(1 - ratio) * 100}%`, flexShrink: 0 } : { flex: "1 1 0" }}
        />
      )}

      </div>{/* end splitContainerRef */}

      {/* Right filter panel — full height */}
      <RightFilterPanel
        mode={panelMode}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={onModeChange}
      />
    </div>
  );
}
