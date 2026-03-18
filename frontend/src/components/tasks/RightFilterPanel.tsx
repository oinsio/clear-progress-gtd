import {
  Search,
  Target,
  MapPin,
  Tag,
  CheckSquare,
  CheckCheck,
  Inbox,
  CircleUser,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import type { PanelSide } from "@/types/common";
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
  route?: string;
}

const FILTER_ITEMS: FilterItem[] = [
  { mode: "inbox", label: "Входящие", Icon: Inbox },
  { mode: "contexts", label: "Контексты", Icon: MapPin, route: ROUTES.CONTEXTS },
  { mode: "categories", label: "Категории", Icon: Tag, route: ROUTES.CATEGORIES },
  { mode: "goals", label: "Цели", Icon: Target, route: ROUTES.GOALS },
  { mode: "tasks", label: "Задачи", Icon: CheckSquare },
  { mode: "completed", label: "Завершённые", Icon: CheckCheck },
];

interface RightFilterPanelProps {
  mode: RightPanelMode;
  isOpen: boolean;
  side?: PanelSide;
  onToggle: () => void;
  onModeChange: (mode: RightPanelMode) => void;
}

export function RightFilterPanel({
  mode,
  isOpen,
  side = "right",
  onToggle,
  onModeChange,
}: RightFilterPanelProps) {
  const navigate = useNavigate();

  const isLeft = side === "left";
  const panelBorder = isLeft ? "border-r border-accent/70" : "border-l border-accent/70";

  return (
    <div
      className={cn(
        "flex flex-shrink-0",
        isLeft && "order-first flex-row-reverse",
      )}
    >
      {/* Main panel */}
      {isOpen ? (
        <div
          className={cn("w-52 flex flex-col bg-accent overflow-hidden cursor-pointer", panelBorder)}
          onClick={onToggle}
          data-testid="right-panel-toggle"
          aria-label="Закрыть панель"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggle()}
        >
          {/* Account / login row */}
          <div className="flex items-center justify-between border-b border-white/20">
            <button
              type="button"
              aria-label="Войти в аккаунт"
              data-testid="right-panel-login"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SETUP); }}
              className="flex-1 flex items-center px-4 py-4 text-white hover:bg-black/15 transition-colors"
            >
              <span className="text-base font-medium">Войдите</span>
            </button>
            <button
              type="button"
              aria-label="Настройки"
              data-testid="right-panel-account"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SETTINGS); }}
              className="flex items-center justify-center px-4 py-4 text-white hover:bg-black/15 transition-colors"
            >
              <CircleUser className="w-8 h-8" aria-hidden="true" />
            </button>
          </div>

          {/* Filter items */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto" aria-label="Фильтры задач">
            {FILTER_ITEMS.map(({ mode: itemMode, label, Icon, route }) => {
              const isActive = mode === itemMode;
              return (
                <button
                  key={itemMode}
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  data-testid={`right-filter-${itemMode}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    route ? navigate(route) : onModeChange(isActive ? null : itemMode);
                  }}
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

          {/* Bottom actions: Search */}
          <div className="px-2 pb-3 border-t border-white/25 pt-2">
            <button
              type="button"
              aria-label="Поиск"
              data-testid="right-filter-search"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SEARCH); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Search className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Поиск</span>
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed strip */
        <div
          className={cn("w-14 flex flex-col items-center bg-accent overflow-hidden cursor-pointer", panelBorder)}
          onClick={onToggle}
          data-testid="right-panel-toggle"
          aria-label="Открыть панель"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggle()}
        >
          {/* Account icon */}
          <button
            type="button"
            aria-label="Настройки"
            data-testid="right-panel-account"
            onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SETTINGS); }}
            className="w-10 h-10 flex items-center justify-center mt-3 mb-1 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <CircleUser className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* All filter icons */}
          <nav className="flex-1 flex flex-col items-center gap-1 py-1 overflow-y-auto" aria-label="Фильтры задач">
            {FILTER_ITEMS.map(({ mode: itemMode, label, Icon, route }) => {
              const isActive = mode === itemMode;
              return (
                <button
                  key={itemMode}
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  data-testid={`right-filter-${itemMode}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    route ? navigate(route) : onModeChange(isActive ? null : itemMode);
                  }}
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

          {/* Bottom: search */}
          <div className="flex flex-col items-center pb-3 gap-1 border-t border-white/25 pt-2">
            <button
              type="button"
              aria-label="Поиск"
              data-testid="right-filter-search"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SEARCH); }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
