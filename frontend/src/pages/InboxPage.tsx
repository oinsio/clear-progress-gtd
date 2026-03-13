import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { TaskList } from "@/components/tasks/TaskList";
import { BoxFilterBar } from "@/components/tasks/BoxFilterBar";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useSearch } from "@/hooks/useSearch";
import type { BoxFilter } from "@/types/common";
import type { Task } from "@/types/entities";
import { BOX_FILTER_ALL, BOX, BOX_FILTER_LABELS } from "@/constants";
import { cn } from "@/shared/lib/cn";
import * as React from "react";

const SEARCH_DEBOUNCE_MS = 300;
const TODAY_SECTION_LABEL = "Сегодня";
const WEEK_SECTION_LABEL = "Неделя";
const LATER_SECTION_LABEL = "Потом";

function TaskSection({
  label,
  tasks,
  onComplete,
  onDelete,
}: {
  label: string;
  tasks: Task[];
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <section>
      <h2 className="px-4 py-2 text-sm font-semibold text-accent bg-gray-50 sticky top-0">
        {label} ({tasks.length})
      </h2>
      <TaskList tasks={tasks} onComplete={onComplete} onDelete={onDelete} />
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
  const [activeBox, setActiveBox] = useState<BoxFilter>(BOX_FILTER_ALL);
  const [filterMode, setFilterMode] = useState<RightPanelMode>("tasks");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { tasks: inboxTasks, completeTask: completeInbox, deleteTask: deleteInbox, createTask: createInboxTask } = useTasks(BOX.INBOX);
  const { tasks: todayTasks, completeTask: completeToday, deleteTask: deleteToday, createTask: createTodayTask } = useTasks(BOX.TODAY);
  const { tasks: weekTasks, completeTask: completeWeek, deleteTask: deleteWeek, createTask: createWeekTask } = useTasks(BOX.WEEK);
  const { tasks: laterTasks, completeTask: completeLater, deleteTask: deleteLater, createTask: createLaterTask } = useTasks(BOX.LATER);
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { completedTasks } = useCompletedTasks();
  const { results: searchResults, isSearching, search, clear: clearSearch } = useSearch();

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handlePanelToggle = useCallback(() => {
    setIsPanelOpen((previous) => !previous);
  }, []);

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      setFilterMode(newMode);
      if (newMode !== "search") {
        setSearchQuery("");
        clearSearch();
      }
      if (newMode !== "goals") setSelectedGoalId(null);
      if (newMode !== "contexts") setSelectedContextId(null);
      if (newMode !== "categories") setSelectedCategoryId(null);
    },
    [clearSearch],
  );

  const handleGoalSelect = useCallback((goalId: string | null) => {
    setSelectedGoalId(goalId);
  }, []);

  const handleContextSelect = useCallback((contextId: string | null) => {
    setSelectedContextId(contextId);
  }, []);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
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

  const renderContent = () => {
    if (filterMode === "search") {
      return (
        <TaskList
          tasks={searchResults}
          onComplete={completeToday}
          onDelete={deleteToday}
        />
      );
    }

    if (filterMode === "inbox") {
      return (
        <TaskList
          tasks={applyFilters(inboxTasks)}
          onComplete={completeInbox}
          onDelete={deleteInbox}
        />
      );
    }

    if (filterMode === "completed") {
      return (
        <TaskList
          tasks={completedTasks}
          onComplete={completeToday}
          onDelete={deleteToday}
        />
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
            onComplete={completeToday}
            onDelete={deleteToday}
          />
          <TaskSection
            label={WEEK_SECTION_LABEL}
            tasks={visibleWeekTasks}
            onComplete={completeWeek}
            onDelete={deleteWeek}
          />
          <TaskSection
            label={LATER_SECTION_LABEL}
            tasks={visibleLaterTasks}
            onComplete={completeLater}
            onDelete={deleteLater}
          />
        </>
      );
    }

    const boxConfig = {
      [BOX.INBOX]: { tasks: inboxTasks, onComplete: completeInbox, onDelete: deleteInbox },
      [BOX.TODAY]: { tasks: todayTasks, onComplete: completeToday, onDelete: deleteToday },
      [BOX.WEEK]: { tasks: weekTasks, onComplete: completeWeek, onDelete: deleteWeek },
      [BOX.LATER]: { tasks: laterTasks, onComplete: completeLater, onDelete: deleteLater },
    };

    const { tasks, onComplete, onDelete } = boxConfig[activeBox];
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
        <TaskList tasks={visibleTasks} onComplete={onComplete} onDelete={onDelete} />
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

        {/* Task area + right panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Scrollable task list */}
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>

          {/* Right quick filter panel */}
          <RightFilterPanel
            mode={filterMode}
            isOpen={isPanelOpen}
            goals={goals}
            contexts={contexts}
            categories={categories}
            selectedGoalId={selectedGoalId}
            selectedContextId={selectedContextId}
            selectedCategoryId={selectedCategoryId}
            onToggle={handlePanelToggle}
            onModeChange={handleModeChange}
            onGoalSelect={handleGoalSelect}
            onContextSelect={handleContextSelect}
            onCategorySelect={handleCategorySelect}
          />
        </div>

        {/* Bottom box filter bar */}
        <BoxFilterBar
          activeBox={activeBox}
          onBoxChange={handleBoxChange}
          onAddTask={handleAddTask}
        />
      </div>
    </div>
  );
}
