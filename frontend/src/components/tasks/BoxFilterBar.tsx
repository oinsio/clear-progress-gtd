import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { BoxFilter } from "@/types/common";
import { TASK_BOX_FILTER_ORDER, BOX_FILTER_LABELS } from "@/constants";

type TaskBoxFilter = Exclude<BoxFilter, "inbox">;

// Filled star inside a thin circle outline — Today
function TodayFilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 6.5l1.545 3.13 3.455.502-2.5 2.437.59 3.441L12 14.3l-3.09 1.71.59-3.441L7 10.132l3.455-.502L12 6.5z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

// Circle with "+7" text — Week (matches reference)
function WeekFilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="6"/>
        <g transform="translate(50,50) scale(1.15) translate(-50,-50)">
            <rect x="30" y="32" width="40" height="36" rx="3" ry="3" fill="none" stroke="currentColor" stroke-width="4"/>
            <line x1="30" y1="42" x2="70" y2="42" stroke="currentColor" stroke-width="4"/>
            <line x1="40" y1="28" x2="40" y2="36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="50" y1="28" x2="50" y2="36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="60" y1="28" x2="60" y2="36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <text x="50" y="55" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="600" fill="currentColor">+7</text>
        </g>
    </svg>
  );
}

// Right-pointing arrow inside a thin circle outline — Later
function LaterFilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.5 12h7M13 9l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Three circle outlines in a triangular cluster: two at the bottom, one at the top center — All boxes
function AllBoxesFilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const BOX_FILTER_ICONS: Record<TaskBoxFilter, React.FC<{ className?: string }>> = {
  today: TodayFilterIcon,
  week: WeekFilterIcon,
  later: LaterFilterIcon,
  all: AllBoxesFilterIcon,
};

// If activeBox is "inbox", display as "all" (inbox has its own page)
const FALLBACK_DISPLAY_BOX: TaskBoxFilter = "all";

function resolveDisplayBox(activeBox: BoxFilter): TaskBoxFilter {
  return activeBox === "inbox" ? FALLBACK_DISPLAY_BOX : activeBox;
}

interface BoxFilterBarProps {
  activeBox: BoxFilter;
  onBoxChange: (box: BoxFilter) => void;
  onAddTask: () => void;
}

export function BoxFilterBar({ activeBox, onBoxChange, onAddTask }: BoxFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayBox = resolveDisplayBox(activeBox);
  const ActiveIcon = BOX_FILTER_ICONS[displayBox];

  const handleSelect = useCallback(
    (box: BoxFilter) => {
      onBoxChange(box);
      setIsExpanded(false);
    },
    [onBoxChange],
  );

  const handleToggle = useCallback(() => {
    setIsExpanded((previous) => !previous);
  }, []);

  // Close on outside click/touch
  useEffect(() => {
    if (!isExpanded) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isExpanded]);

  return (
    <div className="flex items-center border-t border-gray-200 bg-white px-3 py-2 safe-area-bottom">
      <div ref={containerRef} className="flex items-center gap-1">
        {isExpanded ? (
          TASK_BOX_FILTER_ORDER.map((box) => {
            const Icon = BOX_FILTER_ICONS[box as TaskBoxFilter];
            const isActive = box === displayBox;
            return (
              <button
                key={box}
                type="button"
                data-testid={`box-filter-${box}`}
                aria-label={BOX_FILTER_LABELS[box]}
                aria-pressed={isActive}
                onClick={() => handleSelect(box)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
                  isActive
                    ? "text-white bg-accent"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200",
                )}
              >
                <Icon className="w-7 h-7" />
              </button>
            );
          })
        ) : (
          <button
            type="button"
            data-testid="box-filter-toggle"
            aria-label={`Фильтр: ${BOX_FILTER_LABELS[displayBox]}. Нажмите для выбора`}
            aria-expanded={false}
            onClick={handleToggle}
            className="flex items-center gap-0.5 px-1 py-1 text-accent rounded-lg active:bg-accent/10 transition-colors"
          >
            <ActiveIcon className="w-7 h-7" />
            <ChevronDown className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        aria-label="Добавить задачу"
        data-testid="add-task-button"
        onClick={onAddTask}
        className="ml-auto flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
