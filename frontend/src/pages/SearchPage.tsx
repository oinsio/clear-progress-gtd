import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TaskList } from "@/components/tasks/TaskList";
import { GoalItem } from "@/components/goals/GoalItem";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { useSearch } from "@/hooks/useSearch";
import { useGoals } from "@/hooks/useGoals";
import { useContexts } from "@/hooks/useContexts";
import { useCategories } from "@/hooks/useCategories";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { defaultTaskService } from "@/services/defaultServices";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { tasks, goals, isSearching, search, clear } = useSearch();
  const { goals: allGoals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query) {
        clear();
        return;
      }
      debounceRef.current = setTimeout(() => {
        void search(query);
      }, SEARCH_DEBOUNCE_MS);
    },
    [search, clear],
  );

  const handleCompleteTask = useCallback(async (id: string) => {
    const task = await defaultTaskService.getById(id);
    if (!task) return;
    if (task.is_completed) {
      await defaultTaskService.noncomplete(id);
    } else {
      await defaultTaskService.complete(id);
    }
    if (searchQuery) void search(searchQuery);
  }, [searchQuery, search]);

  const handleUpdateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await defaultTaskService.update(id, changes);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleMoveTask = useCallback(
    async (id: string, box: Box) => {
      await defaultTaskService.moveToBox(id, box);
      if (searchQuery) void search(searchQuery);
    },
    [searchQuery, search],
  );

  const handleNavigateToGoal = useCallback(
    (id: string) => {
      navigate(ROUTES.GOALS, { state: { openGoalId: id } });
    },
    [navigate],
  );

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "inbox" || newMode === "tasks" || newMode === "completed") {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      } else if (newMode === "categories") {
        navigate(ROUTES.CATEGORIES);
      } else if (newMode === "contexts") {
        navigate(ROUTES.CONTEXTS);
      } else if (newMode === "goals") {
        navigate(ROUTES.GOALS);
      }
    },
    [navigate],
  );

  const hasResults = tasks.length > 0 || goals.length > 0;
  const hasQuery = searchQuery.length > 0;

  return (
    <div data-testid="search-page" className="relative flex flex-1 overflow-hidden bg-white">
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Search header */}
        <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-white">
          <Search size={16} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t("search.placeholder")}
            autoFocus
            aria-label={t("filter.search")}
            className={cn(
              "flex-1 text-sm outline-none placeholder:text-gray-400",
              isSearching && "opacity-60",
            )}
            data-testid="search-input"
          />
        </header>

        {/* Results */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
          {!hasQuery && (
            <p className="text-sm text-gray-400 text-center py-16">{t("search.emptyQuery")}</p>
          )}

          {hasQuery && !isSearching && !hasResults && (
            <p className="text-sm text-gray-400 text-center py-16">{t("search.noResults")}</p>
          )}

          {tasks.length > 0 && (
            <section aria-label={t("search.tasks")}>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
                {t("search.tasks")}
              </h2>
              <TaskList
                tasks={tasks}
                goals={allGoals}
                contexts={contexts}
                categories={categories}
                onComplete={handleCompleteTask}
                onUpdate={handleUpdateTask}
                onMove={handleMoveTask}
                onDelete={() => {}}
              />
            </section>
          )}

          {goals.length > 0 && (
            <section aria-label={t("search.goals")}>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
                {t("search.goals")}
              </h2>
              <ul>
                {goals.map((goal) => (
                  <GoalItem
                    key={goal.id}
                    goal={goal}
                    taskCount={0}
                    onNavigate={handleNavigateToGoal}
                  />
                ))}
              </ul>
            </section>
          )}
          </div>
        </main>
      </div>

      {/* Right filter panel */}
      <RightFilterPanel
        mode="search"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
