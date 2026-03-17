import type React from "react";
import { Target } from "lucide-react";
import { GoalStatusBadge } from "./GoalStatusBadge";
import type { Goal } from "@/types/entities";

const TASK_COUNT_LABEL = "Задач:";

interface GoalItemProps {
  goal: Goal;
  taskCount: number;
  onNavigate: (id: string) => void;
  nodeRef?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  dragHandle?: React.ReactNode;
}

export function GoalItem({ goal, taskCount, onNavigate, nodeRef, style, dragHandle }: GoalItemProps) {
  return (
    <li
      ref={nodeRef}
      style={style}
      data-testid="goal-item"
      className="flex items-center border-b border-gray-100 bg-white"
    >
      {/* Main clickable area */}
      <button
        type="button"
        data-testid="goal-navigate-button"
        className="flex flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors min-w-0"
        onClick={() => onNavigate(goal.id)}
      >
        {/* Cover / placeholder */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {goal.cover_file_id ? (
            <img
              src={goal.cover_file_id}
              alt={goal.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Target
              data-testid="goal-cover-placeholder"
              className="w-6 h-6 text-gray-300"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Title + task count */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug truncate">
            {goal.title}
          </p>
          {taskCount > 0 && (
            <span
              data-testid="goal-task-count"
              className="text-xs text-gray-400 mt-0.5 block"
            >
              {TASK_COUNT_LABEL} {taskCount}
            </span>
          )}
        </div>
      </button>

      {/* Status badge — right side */}
      <div className="flex-shrink-0 px-2">
        <GoalStatusBadge status={goal.status} />
      </div>

      {/* Drag handle (injected from parent when DnD is active) */}
      {dragHandle}
    </li>
  );
}
