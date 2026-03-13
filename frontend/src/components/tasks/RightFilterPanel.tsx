import { Search, Target, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { Goal } from "@/types/entities";

export type RightPanelMode = "goals" | "search" | null;

interface RightFilterPanelProps {
  mode: RightPanelMode;
  goals: Goal[];
  selectedGoalId: string | null;
  onGoalsToggle: () => void;
  onSearchToggle: () => void;
  onGoalSelect: (id: string | null) => void;
}

export function RightFilterPanel({
  mode,
  goals,
  selectedGoalId,
  onGoalsToggle,
  onSearchToggle,
  onGoalSelect,
}: RightFilterPanelProps) {
  const isGoalsActive = mode === "goals";
  const isSearchActive = mode === "search";

  return (
    <div className="flex flex-shrink-0">
      {/* Goals list panel — visible when goals mode active */}
      {isGoalsActive && (
        <div className="w-36 border-l border-gray-100 bg-white overflow-y-auto">
          <div className="px-2 py-2">
            <button
              type="button"
              onClick={() => onGoalSelect(null)}
              className={cn(
                "w-full text-left px-2 py-1.5 text-xs rounded-lg mb-1 transition-colors",
                selectedGoalId === null
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-500 hover:bg-gray-50",
              )}
            >
              Все цели
            </button>
            {goals
              .filter((goal) => !goal.is_deleted)
              .map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() =>
                    onGoalSelect(selectedGoalId === goal.id ? null : goal.id)
                  }
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-xs rounded-lg mb-0.5 transition-colors leading-tight",
                    selectedGoalId === goal.id
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {goal.title}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Icon strip */}
      <div className="w-11 flex flex-col items-center pt-3 gap-1 border-l border-gray-100 bg-white">
        <button
          type="button"
          aria-label="Фильтр по целям"
          data-testid="right-filter-goals"
          onClick={onGoalsToggle}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
            isGoalsActive
              ? "bg-green-100 text-green-600"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
          )}
        >
          {isGoalsActive && selectedGoalId ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Target className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          aria-label="Поиск по задачам"
          data-testid="right-filter-search"
          onClick={onSearchToggle}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
            isSearchActive
              ? "bg-green-100 text-green-600"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
          )}
        >
          <Search className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
