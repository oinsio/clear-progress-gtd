import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { BoxFilter } from "@/types/common";
import { BOX_FILTER_LABELS, BOX_FILTER_ORDER } from "@/constants";

interface BoxFilterBarProps {
  activeBox: BoxFilter;
  onBoxChange: (box: BoxFilter) => void;
  onAddTask: () => void;
}

export function BoxFilterBar({
  activeBox,
  onBoxChange,
  onAddTask,
}: BoxFilterBarProps) {
  return (
    <div className="flex items-center border-t border-gray-200 bg-white px-2 py-1 safe-area-bottom">
      <div className="flex flex-1 overflow-x-auto gap-0.5 scrollbar-hide">
        {BOX_FILTER_ORDER.map((box) => (
          <button
            key={box}
            type="button"
            data-testid={`box-filter-${box}`}
            onClick={() => onBoxChange(box)}
            className={cn(
              "flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              activeBox === box
                ? "text-green-600 bg-green-50"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
            )}
          >
            {BOX_FILTER_LABELS[box]}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Добавить задачу"
        data-testid="add-task-button"
        onClick={onAddTask}
        className="ml-2 flex-shrink-0 w-9 h-9 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-green-600 active:bg-green-700 transition-colors"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
