import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { BoxFilter } from "@/types/common";
import { TASK_BOX_FILTER_ORDER, BOX_FILTER_LABELS } from "@/constants";
import { TodayBoxIcon, WeekBoxIcon, LaterBoxIcon, AllBoxesIcon } from "./BoxIcons";
import * as React from "react";

type TaskBoxFilter = Exclude<BoxFilter, "inbox">;

const BOX_FILTER_ICONS: Record<TaskBoxFilter, React.FC<{ className?: string }>> = {
  today: TodayBoxIcon,
  week: WeekBoxIcon,
  later: LaterBoxIcon,
  all: AllBoxesIcon,
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
