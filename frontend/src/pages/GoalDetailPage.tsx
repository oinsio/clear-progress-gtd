import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Pencil,
  CheckCheck,
  Plus,
  CircleMinus,
  Pause,
  Square,
  Play,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import { useCoverPreview } from "@/hooks/useCoverPreview";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { useGoal } from "@/hooks/useGoal";
import { useGoalTasks } from "@/hooks/useGoalTasks";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { useCategories } from "@/hooks/useCategories";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useRightPanelNavigation } from "@/hooks/useRightPanelNavigation";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSettings } from "@/hooks/useSettings";
import { AddTaskInput } from "@/components/tasks/AddTaskInput";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { TaskList } from "@/components/tasks/TaskList";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { GoalCoverPicker } from "@/components/goals/GoalCoverPicker";
import { RightFilterPanel } from "@/components/tasks/RightFilterPanel";
import { defaultCoverService } from "@/services/defaultServices";
import { BOX, ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import type { GoalStatus } from "@/types/common";

interface GoalStatusOption {
  status: GoalStatus;
  icon: LucideIcon;
}

const STATUS_OPTIONS: GoalStatusOption[] = [
  { status: "cancelled", icon: CircleMinus },
  { status: "paused", icon: Pause },
  { status: "planning", icon: Square },
  { status: "in_progress", icon: Play },
  { status: "completed", icon: Check },
];

export default function GoalDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    goal,
    isLoading: isGoalLoading,
    reload: reloadGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
  } = useGoal(id ?? "");
  const { url: existingCoverUrl } = useCoverUrl(goal?.cover_file_id ?? "");
  const {
    tasks,
    completedTasks,
    isLoading: isTasksLoading,
    createTask,
    completeTask,
    updateTask,
    moveTask,
    deleteTask,
  } = useGoalTasks(id ?? "");
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const isDesktop = useIsDesktop();
  const { ratio, containerRef: splitContainerRef, handleResizeMouseDown } = usePanelSplit();

  const { defaultBox } = useSettings();
  const isUnsynced = useIsUnsynced(goal ?? { updated_at: "" });

  // view state
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [isCoverRemoved, setIsCoverRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const coverPreviewSrc = useCoverPreview({ pendingCoverFile, isCoverRemoved, existingCoverUrl });

  const hasLoadedRef = useRef(false);
  const isLoading = isGoalLoading || isTasksLoading;

  useEffect(() => {
    if (!isGoalLoading) {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
      } else if (!goal) {
        navigate(ROUTES.GOALS);
      }
    }
  }, [isGoalLoading, goal, navigate]);


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
    () =>
      selectedTaskId
        ? ([...tasks, ...completedTasks].find((task) => task.id === selectedTaskId) ?? null)
        : null,
    [selectedTaskId, tasks, completedTasks],
  );

  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTaskId((previous) => (previous === taskId ? null : taskId));
  }, []);

  const handleDetailPanelClose = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const handleCompleteTask = useCallback(
    async (id: string) => {
      const recurringId = await completeTask(id);
      if (recurringId) setSelectedTaskId(recurringId);
    },
    [completeTask],
  );

  const handleCreateTask = useCallback(
    async (title: string, box: Box, notes: string) => {
      await createTask(title, box, notes);
    },
    [createTask],
  );

  const handleStartEdit = useCallback(() => {
    setEditTitle(goal?.title ?? "");
    setEditDescription(goal?.description ?? "");
    setPendingCoverFile(null);
    setIsCoverRemoved(false);
    setSaveError(null);
    setIsConfirmingDelete(false);
    setIsEditing(true);
  }, [goal]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setSaveError(null);
    setIsConfirmingDelete(false);
  }, []);

  const handleCoverSelect = useCallback((file: File) => {
    setPendingCoverFile(file);
    setIsCoverRemoved(false);
  }, []);

  const handleCoverRemove = useCallback(() => {
    setPendingCoverFile(null);
    setIsCoverRemoved(true);
  }, []);

  const canSave = editTitle.trim().length > 0 && !isSaving;

  const handleSave = useCallback(async () => {
    if (!canSave || !id) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const originalCoverFileId = goal?.cover_file_id ?? "";
      let newCoverFileId = originalCoverFileId;

      if (pendingCoverFile) {
        const result = await defaultCoverService.uploadCover(pendingCoverFile, id);
        newCoverFileId = result.file_id;
        if (originalCoverFileId && originalCoverFileId !== newCoverFileId) {
          void defaultCoverService.deleteCover(originalCoverFileId);
        }
      } else if (isCoverRemoved) {
        newCoverFileId = "";
        if (originalCoverFileId) {
          void defaultCoverService.deleteCover(originalCoverFileId);
        }
      }

      await updateGoal({
        title: editTitle.trim(),
        description: editDescription.trim(),
        cover_file_id: newCoverFileId,
      });
      void reloadGoal();
      setIsEditing(false);
    } catch {
      setSaveError(t("goal.cover.uploadError"));
    } finally {
      setIsSaving(false);
    }
  }, [
    canSave,
    id,
    goal,
    pendingCoverFile,
    isCoverRemoved,
    updateGoal,
    editTitle,
    editDescription,
    reloadGoal,
    t,
  ]);

  const handleStatusChange = useCallback(
    async (newStatus: GoalStatus) => {
      await updateGoalStatus(newStatus);
    },
    [updateGoalStatus],
  );

  const handleDeleteConfirm = useCallback(async () => {
    await deleteGoal();
    navigate(ROUTES.GOALS);
  }, [deleteGoal, navigate]);

  const handleModeChange = useRightPanelNavigation();

  if (!isLoading && !goal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{t("goal.notFound")}</p>
      </div>
    );
  }

  const activeStatus = goal?.status ?? "planning";

  return (
    <div data-testid="goal-detail-page" className="relative flex flex-1 overflow-hidden bg-white">
      <div ref={splitContainerRef} className="flex flex-1 overflow-hidden">
        {/* Main content column */}
        <div
          className={cn("flex flex-col overflow-hidden", !isDesktop && selectedTask && "hidden")}
          style={
            isDesktop && selectedTask
              ? { width: `${ratio * 100}%`, flexShrink: 0 }
              : { flex: "1 1 0" }
          }
        >
          {/* Header */}
          <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              aria-label={t("goal.back")}
              onClick={() => navigate(ROUTES.GOALS)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-accent">{t("selector.goal")}</h1>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto">
            {/* Goal card */}
            {goal && (
              <div
                data-testid="goal-card"
                className={cn(
                  "border-b border-gray-100 relative border-l-2 transition-colors",
                  isUnsynced ? "border-l-amber-400" : "border-l-transparent",
                  isEditing && "pb-2",
                )}
              >
                {isEditing ? (
                  /* Edit mode */
                  <div className="px-4 pt-4 flex flex-col gap-4">
                    {/* Cover + Title row */}
                    <div className="flex items-center gap-3">
                      <GoalCoverPicker
                        previewSrc={coverPreviewSrc}
                        onFileSelect={handleCoverSelect}
                        onRemove={handleCoverRemove}
                      />
                      <div className="flex-1">
                        <label htmlFor="goal-edit-title" className="sr-only">
                          {t("goal.titleLabel")}
                        </label>
                        <input
                          id="goal-edit-title"
                          autoFocus
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder={t("goal.titlePlaceholder")}
                          className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
                          data-testid="goal-title-input"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        htmlFor="goal-edit-description"
                        className="text-xs font-medium text-gray-500 mb-1 block"
                      >
                        {t("goal.descriptionLabel")}
                      </label>
                      <textarea
                        id="goal-edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder={t("goal.descriptionPlaceholder")}
                        rows={3}
                        className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
                        data-testid="goal-description-input"
                      />
                    </div>

                    {/* Status segmented control */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">
                        {t("goal.statusLabel")}
                      </label>
                      <div className="flex rounded-full border border-accent overflow-hidden">
                        {STATUS_OPTIONS.map(({ status: optionStatus, icon: StatusIcon }) => {
                          const isSelected = activeStatus === optionStatus;
                          return (
                            <button
                              key={optionStatus}
                              type="button"
                              aria-label={t(`goal.status.${optionStatus}`)}
                              aria-pressed={isSelected}
                              onClick={() => void handleStatusChange(optionStatus)}
                              className={cn(
                                "flex-1 flex items-center justify-center py-3 transition-colors",
                                isSelected
                                  ? "bg-accent text-white"
                                  : "text-accent bg-white hover:bg-accent/10",
                              )}
                            >
                              <StatusIcon size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save error */}
                    {saveError && (
                      <p data-testid="goal-save-error" className="text-sm text-red-500">
                        {saveError}
                      </p>
                    )}

                    {/* Footer buttons */}
                    <div className="flex gap-2 pb-2">
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        aria-label={t("goal.delete")}
                        data-testid="goal-delete-button"
                        className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        {t("goal.delete")}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        aria-label={t("goal.cancel")}
                        className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {t("goal.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={!canSave}
                        aria-label={t("goal.save")}
                        data-testid="goal-save-button"
                        className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isSaving ? t("goal.cover.uploading") : t("goal.save")}
                      </button>
                    </div>

                    {/* Delete confirmation overlay */}
                    {isConfirmingDelete && (
                      <div
                        data-testid="goal-delete-confirm"
                        className="absolute inset-0 bg-white/95 rounded-b-none flex flex-col items-center justify-center gap-4 px-6 z-10"
                      >
                        <p className="text-base font-medium text-gray-800 text-center">
                          {t("goal.deleteConfirmTitle")}
                        </p>
                        <p className="text-sm text-gray-500 text-center">{editTitle}</p>
                        <div className="flex gap-3 w-full">
                          <button
                            type="button"
                            data-testid="goal-delete-cancel"
                            onClick={() => setIsConfirmingDelete(false)}
                            aria-label={t("goal.cancel")}
                            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            {t("goal.cancel")}
                          </button>
                          <button
                            type="button"
                            data-testid="goal-delete-confirm-btn"
                            onClick={() => void handleDeleteConfirm()}
                            aria-label={t("goal.delete")}
                            className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
                          >
                            {t("goal.delete")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-start gap-3 px-4 py-4">
                    {/* Cover */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={existingCoverUrl ?? defaultCoverSvg}
                        alt={existingCoverUrl ? goal.title : ""}
                        aria-hidden={!existingCoverUrl}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Title + description + status */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium leading-snug">
                        {goal.title}
                      </p>
                      {goal.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                          {goal.description}
                        </p>
                      )}
                      <div className="mt-1">
                        <GoalStatusBadge status={goal.status} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Toggle completed tasks button */}
                      <button
                        type="button"
                        aria-label={showCompleted ? t("goal.hideCompleted") : t("goal.showCompleted")}
                        data-testid="toggle-completed-button"
                        onClick={() => setShowCompleted((prev) => !prev)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                          showCompleted
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                        )}
                      >
                        <CheckCheck className="w-4 h-4" aria-hidden="true" />
                      </button>

                      {/* Edit goal button */}
                      <button
                        type="button"
                        aria-label={t("goal.editTitle")}
                        data-testid="edit-goal-button"
                        onClick={handleStartEdit}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inline task creation input */}
            {isAddingTask && (
              <AddTaskInput
                targetBox={t(`box.${defaultBox}`)}
                onAdd={async (title) => {
                  await handleCreateTask(title, defaultBox, "");
                  setIsAddingTask(false);
                }}
                onCancel={() => setIsAddingTask(false)}
              />
            )}

            {/* Active tasks by box */}
            <BoxSectionList
              isLoading={isLoading}
              tasksByBox={tasksByBox}
              goals={goals}
              contexts={contexts}
              categories={categories}
              onAddPromptClick={() => setIsAddingTask(true)}
              onComplete={handleCompleteTask}
              onUpdate={updateTask}
              onMove={moveTask}
              onDelete={deleteTask}
              onSelect={handleTaskSelect}
              selectedTaskId={selectedTaskId}
            />

            {/* Completed tasks section */}
            {showCompleted && completedTasks.length > 0 && (
              <section>
                <h2 className="px-4 py-2 text-sm font-semibold text-accent bg-gray-50 sticky top-0">
                  {t("goal.completedSection", { count: completedTasks.length })}
                </h2>
                <TaskList
                  tasks={completedTasks}
                  goals={goals}
                  contexts={contexts}
                  categories={categories}
                  onComplete={handleCompleteTask}
                  onUpdate={updateTask}
                  onMove={moveTask}
                  onDelete={deleteTask}
                  onSelect={handleTaskSelect}
                  selectedTaskId={selectedTaskId}
                />
              </section>
            )}
          </main>

          {/* Bottom action bar */}
          <div className="flex items-center justify-end border-t border-gray-200 bg-white px-3 py-2">
            <button
              type="button"
              aria-label={t("task.add")}
              data-testid="add-task-button"
              onClick={() => setIsAddingTask(true)}
              className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

        </div>

        {/* Resize handle between task list and detail panel */}
        {isDesktop && selectedTask && (
          <div
            className="w-1 flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-accent/30 active:bg-accent/50 transition-colors"
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {/* Task detail panel */}
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            goals={goals}
            contexts={contexts}
            categories={categories}
            onUpdate={updateTask}
            onDelete={(taskId) => {
              setSelectedTaskId(null);
              void deleteTask(taskId);
            }}
            onClose={handleDetailPanelClose}
            style={
              isDesktop
                ? { width: `${(1 - ratio) * 100}%`, flexShrink: 0 }
                : { flex: "1 1 0" }
            }
          />
        )}
      </div>

      {/* Right filter panel */}
      <RightFilterPanel
        mode="goals"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
