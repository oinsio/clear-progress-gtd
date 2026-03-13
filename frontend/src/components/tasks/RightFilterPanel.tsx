import {
  Search,
  Target,
  MapPin,
  Tag,
  CheckSquare,
  CheckCheck,
  ChevronRight,
  ChevronLeft,
  Inbox,
  CircleUser,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import type { Goal, Context, Category } from "@/types/entities";
import { ROUTES } from "@/constants";
import * as React from "react";

export type RightPanelMode =
  | "inbox"
  | "tasks"
  | "completed"
  | "goals"
  | "contexts"
  | "categories"
  | "search"
  | null;

interface FilterItem {
  mode: Exclude<RightPanelMode, "search" | null>;
  label: string;
  Icon: React.ElementType;
}

const FILTER_ITEMS: FilterItem[] = [
  { mode: "inbox", label: "Входящие", Icon: Inbox },
  { mode: "contexts", label: "Контексты", Icon: MapPin },
  { mode: "categories", label: "Категории", Icon: Tag },
  { mode: "goals", label: "Цели", Icon: Target },
  { mode: "tasks", label: "Задачи", Icon: CheckSquare },
  { mode: "completed", label: "Завершённые", Icon: CheckCheck },
];

interface SubListItem {
  id: string;
  label: string;
}

function SubListPanel({
  items,
  allLabel,
  selectedId,
  onSelect,
}: {
  items: SubListItem[];
  allLabel: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="w-40 flex flex-col border-l border-gray-100 bg-white overflow-y-auto">
      <div className="px-2 py-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "w-full text-left px-2 py-1.5 text-xs rounded-lg mb-1 transition-colors",
            selectedId === null
              ? "bg-accent/10 text-accent font-medium"
              : "text-gray-500 hover:bg-gray-50",
          )}
        >
          {allLabel}
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(selectedId === item.id ? null : item.id)}
            className={cn(
              "w-full text-left px-2 py-1.5 text-xs rounded-lg mb-0.5 transition-colors leading-tight",
              selectedId === item.id
                ? "bg-accent/10 text-accent font-medium"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface RightFilterPanelProps {
  mode: RightPanelMode;
  isOpen: boolean;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  selectedGoalId: string | null;
  selectedContextId: string | null;
  selectedCategoryId: string | null;
  onToggle: () => void;
  onModeChange: (mode: RightPanelMode) => void;
  onGoalSelect: (id: string | null) => void;
  onContextSelect: (id: string | null) => void;
  onCategorySelect: (id: string | null) => void;
}

export function RightFilterPanel({
  mode,
  isOpen,
  goals,
  contexts,
  categories,
  selectedGoalId,
  selectedContextId,
  selectedCategoryId,
  onToggle,
  onModeChange,
  onGoalSelect,
  onContextSelect,
  onCategorySelect,
}: RightFilterPanelProps) {
  const navigate = useNavigate();

  const activeGoals = goals.filter((goal) => !goal.is_deleted);
  const activeContexts = contexts.filter((context) => !context.is_deleted);
  const activeCategories = categories.filter((category) => !category.is_deleted);

  const showSubList =
    isOpen &&
    (mode === "goals" || mode === "contexts" || mode === "categories");

  return (
    <div className="flex flex-shrink-0">
      {/* Sub-list for goals / contexts / categories */}
      {showSubList && mode === "goals" && (
        <SubListPanel
          items={activeGoals.map((goal) => ({ id: goal.id, label: goal.title }))}
          allLabel="Все цели"
          selectedId={selectedGoalId}
          onSelect={onGoalSelect}
        />
      )}
      {showSubList && mode === "contexts" && (
        <SubListPanel
          items={activeContexts.map((context) => ({
            id: context.id,
            label: context.name,
          }))}
          allLabel="Все контексты"
          selectedId={selectedContextId}
          onSelect={onContextSelect}
        />
      )}
      {showSubList && mode === "categories" && (
        <SubListPanel
          items={activeCategories.map((category) => ({
            id: category.id,
            label: category.name,
          }))}
          allLabel="Все категории"
          selectedId={selectedCategoryId}
          onSelect={onCategorySelect}
        />
      )}

      {/* Main panel */}
      {isOpen ? (
        <div className="w-52 flex flex-col bg-accent border-l border-accent/70 overflow-hidden">
          {/* Account / login row */}
          <button
            type="button"
            aria-label="Войти в аккаунт"
            data-testid="right-panel-account"
            onClick={() => navigate(ROUTES.SETUP)}
            className="flex items-center justify-between px-4 py-4 text-white hover:bg-black/15 transition-colors border-b border-white/20"
          >
            <span className="text-base font-medium">Войдите</span>
            <CircleUser className="w-8 h-8" aria-hidden="true" />
          </button>

          {/* Filter items */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto" aria-label="Фильтры задач">
            {FILTER_ITEMS.map(({ mode: itemMode, label, Icon }) => {
              const isActive = mode === itemMode;
              return (
                <button
                  key={itemMode}
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  data-testid={`right-filter-${itemMode}`}
                  onClick={() => onModeChange(isActive ? null : itemMode)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom actions: Search + Settings + Close */}
          <div className="px-2 pb-3 border-t border-white/25 pt-2 space-y-0.5">
            <button
              type="button"
              aria-label="Поиск по задачам"
              aria-pressed={mode === "search"}
              data-testid="right-filter-search"
              onClick={() => onModeChange(mode === "search" ? null : "search")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                mode === "search"
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Search className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Поиск</span>
            </button>

            <button
              type="button"
              aria-label="Настройки"
              data-testid="right-panel-settings"
              onClick={() => navigate(ROUTES.SETTINGS)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Settings className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Настройки</span>
            </button>

            <button
              type="button"
              aria-label="Закрыть панель"
              data-testid="right-panel-toggle"
              onClick={onToggle}
              className="w-full flex items-center justify-end px-3 py-2 text-white/50 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed strip */
        <div className="w-14 flex flex-col items-center bg-accent border-l border-accent/70 overflow-hidden">
          {/* Account icon */}
          <button
            type="button"
            aria-label="Войти в аккаунт"
            data-testid="right-panel-account"
            onClick={() => navigate(ROUTES.SETUP)}
            className="w-10 h-10 flex items-center justify-center mt-3 mb-1 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <CircleUser className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* All filter icons */}
          <nav className="flex-1 flex flex-col items-center gap-1 py-1 overflow-y-auto" aria-label="Фильтры задач">
            {FILTER_ITEMS.map(({ mode: itemMode, label, Icon }) => {
              const isActive = mode === itemMode;
              return (
                <button
                  key={itemMode}
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  data-testid={`right-filter-${itemMode}`}
                  onClick={() => onModeChange(isActive ? null : itemMode)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </button>
              );
            })}
          </nav>

          {/* Bottom: search + expand toggle */}
          <div className="flex flex-col items-center pb-3 gap-1 border-t border-white/25 pt-2">
            <button
              type="button"
              aria-label="Поиск по задачам"
              aria-pressed={mode === "search"}
              data-testid="right-filter-search"
              onClick={() => onModeChange(mode === "search" ? null : "search")}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                mode === "search"
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Открыть панель"
              data-testid="right-panel-toggle"
              onClick={onToggle}
              className="w-10 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
