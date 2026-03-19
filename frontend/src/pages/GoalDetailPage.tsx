import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {ArrowLeft, Pencil, CheckCheck, Plus, Target} from "lucide-react";
import { buildCoverThumbnailUrl } from "@/services/CoverService";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { useGoal } from "@/hooks/useGoal";
import { useGoalTasks } from "@/hooks/useGoalTasks";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { useCategories } from "@/hooks/useCategories";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useRightPanelNavigation } from "@/hooks/useRightPanelNavigation";
import { TaskCreateSheet } from "@/components/tasks/TaskCreateSheet";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { TaskList } from "@/components/tasks/TaskList";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { RightFilterPanel } from "@/components/tasks/RightFilterPanel";
import GoalPage from "@/pages/GoalPage";
import { BOX, ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";

const GOAL_NOT_FOUND_MESSAGE = "Цель не найдена";
const COMPLETED_SECTION_LABEL = "Выполненные";
const PAGE_TITLE = "Цель";

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { goal, isLoading: isGoalLoading, reload: reloadGoal } = useGoal(id ?? "");
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

  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isCreateTaskSheetOpen, setIsCreateTaskSheetOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

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

  const handleCreateTask = useCallback(
    async (title: string, box: Box, notes: string) => {
      await createTask(title, box, notes);
    },
    [createTask],
  );

  const handleGoalEditClose = useCallback(() => {
    setIsEditGoalOpen(false);
    void reloadGoal();
  }, [reloadGoal]);

  const handleModeChange = useRightPanelNavigation();

  if (!isLoading && !goal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{GOAL_NOT_FOUND_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div data-testid="goal-detail-page" className="flex h-screen overflow-hidden bg-white">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            aria-label="Назад"
            onClick={() => navigate(ROUTES.GOALS)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-accent">{PAGE_TITLE}</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Goal card */}
          {goal && (
            <div
              data-testid="goal-card"
              className="flex items-center gap-3 px-4 py-4 border-b border-gray-100"
            >
              {/* Cover */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                <img
                  src={
                    goal.cover_file_id
                      ? buildCoverThumbnailUrl(goal.cover_file_id)
                      : defaultCoverSvg
                  }
                  alt={goal.cover_file_id ? goal.title : ""}
                  aria-hidden={!goal.cover_file_id}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium leading-snug">{goal.title}</p>
                <GoalStatusBadge status={goal.status} />
              </div>

              {/* Toggle completed tasks button */}
              <button
                type="button"
                aria-label={showCompleted ? "Скрыть выполненные" : "Показать выполненные"}
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
                aria-label="Редактировать цель"
                data-testid="edit-goal-button"
                onClick={() => setIsEditGoalOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Active tasks by box */}
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

          {/* Completed tasks section */}
          {showCompleted && completedTasks.length > 0 && (
            <section>
              <h2 className="px-4 py-2 text-sm font-semibold text-accent bg-gray-50 sticky top-0">
                {COMPLETED_SECTION_LABEL} ({completedTasks.length})
              </h2>
              <TaskList
                tasks={completedTasks}
                goals={goals}
                contexts={contexts}
                categories={categories}
                onComplete={completeTask}
                onUpdate={updateTask}
                onMove={moveTask}
                onDelete={deleteTask}
              />
            </section>
          )}
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

        {/* Task create sheet */}
        {isCreateTaskSheetOpen && goal && (
          <TaskCreateSheet
            entityLabel="Цель"
            entityName={goal.title}
            entityIcon={Target}
            onSave={handleCreateTask}
            onClose={() => setIsCreateTaskSheetOpen(false)}
          />
        )}
      </div>

      {/* Goal edit modal */}
      {isEditGoalOpen && id && (
        <GoalPage goalId={id} onClose={handleGoalEditClose} />
      )}

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
