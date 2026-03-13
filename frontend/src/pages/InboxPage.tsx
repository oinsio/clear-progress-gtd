import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TaskList } from "@/components/tasks/TaskList";
import { BoxFilterBar } from "@/components/tasks/BoxFilterBar";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { useTasks } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useSearch } from "@/hooks/useSearch";
import type { BoxFilter } from "@/types/common";
import type { Task } from "@/types/entities";
import { BOX_FILTER_ALL, BOX, BOX_FILTER_LABELS } from "@/constants";
import { cn } from "@/shared/lib/cn";

const SEARCH_DEBOUNCE_MS = 300;
const TODAY_SECTION_LABEL = "Сегодня";
const WEEK_SECTION_LABEL = "Неделя";

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
      <h2 className="px-4 py-2 text-sm font-semibold text-green-600 bg-gray-50 sticky top-0">
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
      <div className="w-5 h-5 rounded-full border-2 border-green-400 flex-shrink-0" />
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
  const [rightPanel, setRightPanel] = useState<RightPanelMode>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { tasks: inboxTasks, completeTask: completeInbox, deleteTask: deleteInbox, createTask: createInboxTask } = useTasks(BOX.INBOX);
  const { tasks: todayTasks, completeTask: completeToday, deleteTask: deleteToday, createTask: createTodayTask } = useTasks(BOX.TODAY);
  const { tasks: weekTasks, completeTask: completeWeek, deleteTask: deleteWeek, createTask: createWeekTask } = useTasks(BOX.WEEK);
  const { tasks: laterTasks, completeTask: completeLater, deleteTask: deleteLater, createTask: createLaterTask } = useTasks(BOX.LATER);
  const { goals } = useGoals();
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

  const handleSearchToggle = useCallback(() => {
    if (rightPanel === "search") {
      setRightPanel(null);
      setSearchQuery("");
      clearSearch();
    } else {
      setRightPanel("search");
    }
  }, [rightPanel, clearSearch]);

  const handleGoalsToggle = useCallback(() => {
    if (rightPanel === "goals") {
      setRightPanel(null);
      setSelectedGoalId(null);
    } else {
      setRightPanel("goals");
    }
  }, [rightPanel]);

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

  const applyGoalFilter = useCallback(
    (tasks: Task[]): Task[] => {
      if (!selectedGoalId) return tasks;
      return tasks.filter((task) => task.goal_id === selectedGoalId);
    },
    [selectedGoalId],
  );

  const targetBoxLabel = useMemo(() => {
    const targetBox = activeBox === BOX_FILTER_ALL ? BOX.TODAY : activeBox;
    return BOX_FILTER_LABELS[targetBox];
  }, [activeBox]);

  const renderContent = () => {
    if (rightPanel === "search") {
      return (
        <TaskList
          tasks={searchResults}
          onComplete={completeToday}
          onDelete={deleteToday}
        />
      );
    }

    if (activeBox === BOX_FILTER_ALL) {
      const visibleTodayTasks = applyGoalFilter(todayTasks);
      const visibleWeekTasks = applyGoalFilter(weekTasks);
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
    const visibleTasks = applyGoalFilter(tasks);

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
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Search header */}
        {rightPanel === "search" && (
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
            mode={rightPanel}
            goals={goals}
            selectedGoalId={selectedGoalId}
            onGoalsToggle={handleGoalsToggle}
            onSearchToggle={handleSearchToggle}
            onGoalSelect={handleGoalSelect}
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
