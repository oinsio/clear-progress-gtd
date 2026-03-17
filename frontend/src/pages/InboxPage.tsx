import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { TaskList } from "@/components/tasks/TaskList";
import { BoxFilterBar } from "@/components/tasks/BoxFilterBar";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useSearch } from "@/hooks/useSearch";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import type { BoxFilter, Box } from "@/types/common";
import type { Task } from "@/types/entities";
import { BOX_FILTER_ALL, BOX, BOX_FILTER_LABELS } from "@/constants";
import { cn } from "@/shared/lib/cn";
import * as React from "react";

const SEARCH_DEBOUNCE_MS = 300;
const TODAY_SECTION_LABEL = "Сегодня";
const WEEK_SECTION_LABEL = "Неделя";
const LATER_SECTION_LABEL = "Позже";
const COMPLETED_TODAY_SECTION_LABEL = "Выполненные сегодня";
const COMPLETED_EARLIER_SECTION_LABEL = "Ранее";
const TODAY_EMPTY_MESSAGE = "Задач на сегодня нет";
const INBOX_SECTION_LABEL = "Входящие";
const INBOX_EMPTY_MESSAGE = "Задач нет";

function TaskSection({
  label,
  tasks,
  goals,
  onComplete,
  onUpdate,
  onMove,
  onDelete,
  onReorder,
  emptyMessage,
  hideEmptyState,
}: {
  label: string;
  tasks: Task[];
  goals: ReturnType<typeof useGoals>["goals"];
  onComplete: (id: string) => Promise<void>;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder?: (tasks: Task[]) => Promise<void>;
  emptyMessage?: string;
  hideEmptyState?: boolean;
}) {
  return (
    <section>
      <h2 className="px-4 py-2 text-sm font-semibold text-accent bg-gray-50 sticky top-0">
        {label} ({tasks.length})
      </h2>
      {(!hideEmptyState || tasks.length > 0) && (
        <TaskList
          tasks={tasks}
          goals={goals}
          onComplete={onComplete}
          onUpdate={onUpdate}
          onMove={onMove}
          onDelete={onDelete}
          onReorder={onReorder}
          emptyMessage={emptyMessage}
        />
      )}
    </section>
  );
}

function AddTaskInput({
  targetBox,
  onAdd,
  onCancel,
}: {
  targetBox: string;
  onAdd: (title: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && inputValue.trim()) {
        await onAdd(inputValue.trim());
        setInputValue("");
      } else if (event.key === "Escape") {
        onCancel();
      }
    },
    [inputValue, onAdd, onCancel],
  );

  return (
    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-accent flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        placeholder={`Задача в «${targetBox}»`}
        className="flex-1 text-sm outline-none placeholder:text-gray-400"
        data-testid="add-task-input"
      />
    </div>
  );
}

export default function InboxPage() {
  const location = useLocation();
  const initialFilterMode = (location.state as { filterMode?: RightPanelMode } | null)?.filterMode ?? "tasks";
  const [activeBox, setActiveBox] = useState<BoxFilter>(BOX_FILTER_ALL);
  const [filterMode, setFilterMode] = useState<RightPanelMode>(initialFilterMode);
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { tasks: inboxTasks, completeTask: completeInbox, deleteTask: deleteInbox, createTask: createInboxTask, updateTask: updateInbox, moveTask: moveInbox, reorderTasks: reorderInbox, reload: reloadInbox } = useTasks(BOX.INBOX);
  const { tasks: todayTasks, completeTask: completeToday, deleteTask: deleteToday, createTask: createTodayTask, updateTask: updateToday, moveTask: moveToday, reorderTasks: reorderToday, reload: reloadToday } = useTasks(BOX.TODAY);
  const { tasks: weekTasks, completeTask: completeWeek, deleteTask: deleteWeek, createTask: createWeekTask, updateTask: updateWeek, moveTask: moveWeek, reorderTasks: reorderWeek, reload: reloadWeek } = useTasks(BOX.WEEK);
  const { tasks: laterTasks, completeTask: completeLater, deleteTask: deleteLater, createTask: createLaterTask, updateTask: updateLater, moveTask: moveLater, reorderTasks: reorderLater, reload: reloadLater } = useTasks(BOX.LATER);
  const { goals } = useGoals();
  const { completedTasks, reload: reloadCompleted } = useCompletedTasks();
  const { results: searchResults, isSearching, search, clear: clearSearch } = useSearch();
  const { panelSide } = usePanelSide();

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reloadAllBoxes = useCallback(async () => {
    await Promise.all([reloadInbox(), reloadToday(), reloadWeek(), reloadLater()]);
  }, [reloadInbox, reloadToday, reloadWeek, reloadLater]);

  const handleMoveTask = useCallback(
    async (id: string, targetBox: Box) => {
      const allTasks = [...inboxTasks, ...todayTasks, ...weekTasks, ...laterTasks];
      const task = allTasks.find((t) => t.id === id);
      if (!task) return;

      const moveByBox: Record<Box, (taskId: string, box: Box) => Promise<void>> = {
        [BOX.INBOX]: moveInbox,
        [BOX.TODAY]: moveToday,
        [BOX.WEEK]: moveWeek,
        [BOX.LATER]: moveLater,
      };
      await moveByBox[task.box](id, targetBox);
      await reloadAllBoxes();
    },
    [inboxTasks, todayTasks, weekTasks, laterTasks, moveInbox, moveToday, moveWeek, moveLater, reloadAllBoxes],
  );

  const handleUpdateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      const allTasks = [...inboxTasks, ...todayTasks, ...weekTasks, ...laterTasks];
      const task = allTasks.find((t) => t.id === id);
      if (!task) return;

      const updateByBox: Record<Box, (taskId: string, taskChanges: Partial<Task>) => Promise<void>> = {
        [BOX.INBOX]: updateInbox,
        [BOX.TODAY]: updateToday,
        [BOX.WEEK]: updateWeek,
        [BOX.LATER]: updateLater,
      };

      const targetBox = (changes.box as Box) ?? task.box;
      if (changes.box && changes.box !== task.box) {
        await handleMoveTask(id, changes.box as Box);
      } else {
        await updateByBox[task.box](id, changes);
        if (targetBox !== task.box) {
          await reloadAllBoxes();
        }
      }
    },
    [inboxTasks, todayTasks, weekTasks, laterTasks, updateInbox, updateToday, updateWeek, updateLater, handleMoveTask, reloadAllBoxes],
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      setSearchQuery(query);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        void search(query);
      }, SEARCH_DEBOUNCE_MS);
    },
    [search],
  );

  const handlePanelToggle = togglePanelOpen;

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      setFilterMode(newMode);
      if (newMode !== "search") {
        setSearchQuery("");
        clearSearch();
      }
      if (newMode === "completed") void reloadCompleted();
      if (newMode !== "goals") setSelectedGoalId(null);
      if (newMode !== "contexts") setSelectedContextId(null);
      if (newMode !== "categories") setSelectedCategoryId(null);
    },
    [clearSearch, reloadCompleted],
  );

  const handleGoalSelect = useCallback((goalId: string | null) => {
    setSelectedGoalId(goalId);
  }, []);

  const handleBoxChange = useCallback((box: BoxFilter) => {
    setActiveBox(box);
    setIsAddingTask(false);
  }, []);

  const handleAddTask = useCallback(() => {
    setIsAddingTask(true);
  }, []);

  const handleAddTaskSubmit = useCallback(
    async (title: string) => {
      const targetBox = activeBox === BOX_FILTER_ALL ? BOX.TODAY : activeBox;
      const createFunctions = {
        [BOX.INBOX]: createInboxTask,
        [BOX.TODAY]: createTodayTask,
        [BOX.WEEK]: createWeekTask,
        [BOX.LATER]: createLaterTask,
      };
      await createFunctions[targetBox](title);
      setIsAddingTask(false);
    },
    [activeBox, createInboxTask, createTodayTask, createWeekTask, createLaterTask],
  );

  const handleAddTaskCancel = useCallback(() => {
    setIsAddingTask(false);
  }, []);

  const applyFilters = useCallback(
    (tasks: Task[]): Task[] => {
      let filtered = tasks.filter((task) => !task.is_completed);
      if (selectedGoalId) {
        filtered = filtered.filter((task) => task.goal_id === selectedGoalId);
      }
      if (selectedContextId) {
        filtered = filtered.filter((task) => task.context_id === selectedContextId);
      }
      if (selectedCategoryId) {
        filtered = filtered.filter((task) => task.category_id === selectedCategoryId);
      }
      return filtered;
    },
    [selectedGoalId, selectedContextId, selectedCategoryId],
  );

  const targetBoxLabel = useMemo(() => {
    const targetBox = activeBox === BOX_FILTER_ALL ? BOX.TODAY : activeBox;
    return BOX_FILTER_LABELS[targetBox];
  }, [activeBox]);

  const handleCompleteTodayAndReload = useCallback(
    async (id: string) => {
      await completeToday(id);
      await reloadCompleted();
    },
    [completeToday, reloadCompleted],
  );

  const handleCompleteWeekAndReload = useCallback(
    async (id: string) => {
      await completeWeek(id);
      await reloadCompleted();
    },
    [completeWeek, reloadCompleted],
  );

  const handleCompleteLaterAndReload = useCallback(
    async (id: string) => {
      await completeLater(id);
      await reloadCompleted();
    },
    [completeLater, reloadCompleted],
  );

  const { todayCompletedTasks, earlierCompletedTasks } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today: Task[] = [];
    const earlier: Task[] = [];
    for (const task of completedTasks) {
      if (task.completed_at && new Date(task.completed_at) >= startOfToday) {
        today.push(task);
      } else {
        earlier.push(task);
      }
    }
    return { todayCompletedTasks: today, earlierCompletedTasks: earlier };
  }, [completedTasks]);

  const renderContent = () => {
    if (filterMode === "search") {
      return (
        <TaskList
          tasks={searchResults}
          goals={goals}
          onComplete={completeToday}
          onUpdate={handleUpdateTask}
          onMove={handleMoveTask}
          onDelete={deleteToday}
        />
      );
    }

    if (filterMode === "inbox") {
      return (
        <TaskSection
          label={INBOX_SECTION_LABEL}
          tasks={applyFilters(inboxTasks)}
          goals={goals}
          onComplete={completeInbox}
          onUpdate={handleUpdateTask}
          onMove={handleMoveTask}
          onDelete={deleteInbox}
          onReorder={reorderInbox}
          emptyMessage={INBOX_EMPTY_MESSAGE}
        />
      );
    }

    if (filterMode === "completed") {
      return (
        <>
          {todayCompletedTasks.length > 0 && (
            <TaskSection
              label={TODAY_SECTION_LABEL}
              tasks={todayCompletedTasks}
              goals={goals}
              onComplete={handleCompleteTodayAndReload}
              onUpdate={handleUpdateTask}
              onMove={handleMoveTask}
              onDelete={deleteToday}
            />
          )}
          {earlierCompletedTasks.length > 0 && (
            <TaskSection
              label={COMPLETED_EARLIER_SECTION_LABEL}
              tasks={earlierCompletedTasks}
              goals={goals}
              onComplete={handleCompleteTodayAndReload}
              onUpdate={handleUpdateTask}
              onMove={handleMoveTask}
              onDelete={deleteToday}
            />
          )}
          {completedTasks.length === 0 && (
            <TaskList
              tasks={[]}
              goals={goals}
              onComplete={handleCompleteTodayAndReload}
              onUpdate={handleUpdateTask}
              onMove={handleMoveTask}
              onDelete={deleteToday}
            />
          )}
        </>
      );
    }

    if (activeBox === BOX_FILTER_ALL) {
      const visibleTodayTasks = applyFilters(todayTasks);
      const visibleWeekTasks = applyFilters(weekTasks);
      const visibleLaterTasks = applyFilters(laterTasks);
      return (
        <>
          {isAddingTask && (
            <AddTaskInput
              targetBox={targetBoxLabel}
              onAdd={handleAddTaskSubmit}
              onCancel={handleAddTaskCancel}
            />
          )}
          <TaskSection
            label={TODAY_SECTION_LABEL}
            tasks={visibleTodayTasks}
            goals={goals}
            onComplete={handleCompleteTodayAndReload}
            onUpdate={handleUpdateTask}
            onMove={handleMoveTask}
            onDelete={deleteToday}
            onReorder={reorderToday}
            emptyMessage={TODAY_EMPTY_MESSAGE}
          />
          <TaskSection
            label={WEEK_SECTION_LABEL}
            tasks={visibleWeekTasks}
            goals={goals}
            onComplete={handleCompleteWeekAndReload}
            onUpdate={handleUpdateTask}
            onMove={handleMoveTask}
            onDelete={deleteWeek}
            onReorder={reorderWeek}
            hideEmptyState
          />
          <TaskSection
            label={LATER_SECTION_LABEL}
            tasks={visibleLaterTasks}
            goals={goals}
            onComplete={handleCompleteLaterAndReload}
            onUpdate={handleUpdateTask}
            onMove={handleMoveTask}
            onDelete={deleteLater}
            onReorder={reorderLater}
            hideEmptyState
          />
          {todayCompletedTasks.length > 0 && (
            <TaskSection
              label={COMPLETED_TODAY_SECTION_LABEL}
              tasks={todayCompletedTasks}
              goals={goals}
              onComplete={handleCompleteTodayAndReload}
              onUpdate={handleUpdateTask}
              onMove={handleMoveTask}
              onDelete={deleteToday}
            />
          )}
        </>
      );
    }

    const boxConfig = {
      [BOX.INBOX]: { tasks: inboxTasks, onComplete: completeInbox, onDelete: deleteInbox, onReorder: reorderInbox },
      [BOX.TODAY]: { tasks: todayTasks, onComplete: completeToday, onDelete: deleteToday, onReorder: reorderToday },
      [BOX.WEEK]: { tasks: weekTasks, onComplete: completeWeek, onDelete: deleteWeek, onReorder: reorderWeek },
      [BOX.LATER]: { tasks: laterTasks, onComplete: completeLater, onDelete: deleteLater, onReorder: reorderLater },
    };

    const { tasks, onComplete, onDelete, onReorder } = boxConfig[activeBox];
    const visibleTasks = applyFilters(tasks);

    return (
      <>
        {isAddingTask && (
          <AddTaskInput
            targetBox={targetBoxLabel}
            onAdd={handleAddTaskSubmit}
            onCancel={handleAddTaskCancel}
          />
        )}
        <TaskList
          tasks={visibleTasks}
          goals={goals}
          onComplete={onComplete}
          onUpdate={handleUpdateTask}
          onMove={handleMoveTask}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      </>
    );
  };

  return (
    <div
      data-testid="inbox-page"
      className="flex h-screen overflow-hidden bg-white"
    >
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Search header */}
        {filterMode === "search" && (
          <header className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Поиск задач..."
              autoFocus
              className={cn(
                "flex-1 text-sm outline-none placeholder:text-gray-400",
                isSearching && "opacity-60",
              )}
              data-testid="search-input"
            />
          </header>
        )}

          {/* Scrollable task list */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Bottom box filter bar — hidden in inbox mode */}
        {filterMode === "inbox" ? (
          <div className="flex items-center justify-end border-t border-gray-200 bg-white px-3 py-2 safe-area-bottom">
            <button
              type="button"
              aria-label="Добавить задачу"
              data-testid="add-task-button"
              onClick={handleAddTask}
              className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <BoxFilterBar
            activeBox={activeBox}
            onBoxChange={handleBoxChange}
            onAddTask={handleAddTask}
          />
        )}
      </div>

      {/* Right quick filter panel — full height, outside main column */}
      <RightFilterPanel
        mode={filterMode}
        isOpen={isPanelOpen}
        goals={goals}
        selectedGoalId={selectedGoalId}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
        onGoalSelect={handleGoalSelect}
      />
    </div>
  );
}
