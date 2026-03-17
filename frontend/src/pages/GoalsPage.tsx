import { useState, useCallback, useEffect } from "react";
import { Target, Plus, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { GoalItem } from "@/components/goals/GoalItem";
import { GoalCreateSheet } from "@/components/goals/GoalCreateSheet";
import type { GoalCreateData } from "@/components/goals/GoalCreateSheet";
import GoalPage from "@/pages/GoalPage";
import { useGoals } from "@/hooks/useGoals";
import { useTasks } from "@/hooks/useTasks";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useInlineAdd } from "@/hooks/useInlineAdd";
import { BOX, ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import type { Goal } from "@/types/entities";

function SortableGoalItem({
  goal,
  taskCount,
  onNavigate,
}: {
  goal: Goal;
  taskCount: number;
  onNavigate: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Перетащить цель"
      className="flex-shrink-0 px-3 py-3 text-gray-300 hover:text-gray-400 touch-none cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="w-4 h-4" aria-hidden="true" />
    </button>
  );

  return (
    <GoalItem
      goal={goal}
      taskCount={taskCount}
      onNavigate={onNavigate}
      nodeRef={setNodeRef}
      style={style}
      dragHandle={dragHandle}
    />
  );
}

const defaultTaskService = new TaskService(new TaskRepository());

const PAGE_TITLE = "Мои цели";
const EMPTY_GOALS_MESSAGE = "Нет ни одной цели";
const ADD_TASK_PLACEHOLDER = "Название задачи...";

export default function GoalsPage() {
  const { goals, isLoading, createGoal, reloadGoals, reorderGoals } = useGoals();
  const { createTask } = useTasks(BOX.INBOX);
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const navigate = useNavigate();
  const sensors = useDndSensors();

  const [goalTaskCounts, setGoalTaskCounts] = useState<Record<string, number>>({});
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const handleGoalCreate = useCallback(
    async (data: GoalCreateData) => {
      await createGoal(data);
    },
    [createGoal],
  );

  const {
    isAdding: isAddingTask,
    setIsAdding: setIsAddingTask,
    value: newTaskTitle,
    setValue: setNewTaskTitle,
    handleKeyDown: handleAddTaskKeyDown,
    handleBlur: handleAddTaskBlur,
  } = useInlineAdd(createTask);

  const activeGoals = goals.filter((goal) => !goal.is_deleted);

  useEffect(() => {
    void defaultTaskService.getGoalTaskCounts().then(setGoalTaskCounts);
  }, []);

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      } else if (newMode === "categories") {
        navigate(ROUTES.CATEGORIES);
      } else if (newMode === "contexts") {
        navigate(ROUTES.CONTEXTS);
      }
    },
    [navigate],
  );

  const handleGoalNavigate = useCallback((id: string) => {
    setSelectedGoalId(id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeGoals.findIndex((goal) => goal.id === active.id);
      const newIndex = activeGoals.findIndex((goal) => goal.id === over.id);
      const reordered = arrayMove(activeGoals, oldIndex, newIndex);
      void reorderGoals(reordered);
    },
    [activeGoals, reorderGoals],
  );

  return (
    <div data-testid="goals-page" className="flex h-screen overflow-hidden bg-white">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-accent">{PAGE_TITLE}</h1>
        </header>

        {/* Scrollable goal list */}
        <main className="flex-1 overflow-y-auto">
          {!isLoading && activeGoals.length === 0 ? (
            <div className="flex flex-col items-center py-3" data-testid="empty-goals-message">
              <p className="text-gray-400 text-sm">{EMPTY_GOALS_MESSAGE}</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeGoals.map((goal) => goal.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul>
                  {activeGoals.map((goal) => (
                    <SortableGoalItem
                      key={goal.id}
                      goal={goal}
                      taskCount={goalTaskCounts[goal.id] ?? 0}
                      onNavigate={handleGoalNavigate}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {/* Inline add task input */}
          {isAddingTask && (
            <div className="px-4 py-3 border-b border-gray-100">
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                onKeyDown={handleAddTaskKeyDown}
                onBlur={handleAddTaskBlur}
                placeholder={ADD_TASK_PLACEHOLDER}
                className="w-full text-sm outline-none placeholder:text-gray-400"
                data-testid="add-task-input"
              />
            </div>
          )}
        </main>

        {/* Bottom action bar */}
        <div
          className={cn(
            "flex items-center border-t border-gray-200 bg-white px-3 py-2",
            panelSide === "left" && "flex-row-reverse",
          )}
        >
          {/* Add goal button */}
          <button
            type="button"
            aria-label="Добавить цель"
            data-testid="add-goal-button"
            onClick={() => setIsGoalSheetOpen(true)}
            className="relative flex items-center justify-center w-10 h-10 rounded-full text-accent hover:bg-accent/10 active:bg-accent/20 transition-colors"
          >
            <Target className="w-5 h-5" aria-hidden="true" />
            <Plus
              className="w-3 h-3 absolute bottom-1 right-1"
              aria-hidden="true"
            />
          </button>

          {/* Add task button */}
          <button
            type="button"
            aria-label="Добавить задачу"
            data-testid="add-task-button"
            onClick={() => setIsAddingTask(true)}
            className="ml-auto flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Goal create sheet */}
      {isGoalSheetOpen && (
        <GoalCreateSheet
          onSave={handleGoalCreate}
          onClose={() => setIsGoalSheetOpen(false)}
        />
      )}

      {/* Goal edit modal */}
      {selectedGoalId !== null && (
        <GoalPage
          goalId={selectedGoalId}
          onClose={() => {
            setSelectedGoalId(null);
            void reloadGoals();
          }}
        />
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
