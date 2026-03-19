import type React from "react";
import { GoalStatusBadge } from "./GoalStatusBadge";
import type { Goal } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { formatShortDateTime } from "@/shared/lib/utils";
import { buildCoverThumbnailUrl } from "@/services/CoverService";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";

const TASK_COUNT_LABEL = "Задач:";
const FINISHED_GOAL_STATUSES = new Set<GoalStatus>(["completed", "cancelled"]);

interface GoalItemProps {
  goal: Goal;
  taskCount: number;
  onNavigate: (id: string) => void;
  nodeRef?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  dragHandle?: React.ReactNode;
}

export function GoalItem({ goal, taskCount, onNavigate, nodeRef, style, dragHandle }: GoalItemProps) {
  const isFinished = FINISHED_GOAL_STATUSES.has(goal.status);
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
        {/* Cover */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            data-testid={goal.cover_file_id ? "goal-cover-img" : "goal-cover-placeholder"}
            src={goal.cover_file_id ? buildCoverThumbnailUrl(goal.cover_file_id) : defaultCoverSvg}
            alt={goal.cover_file_id ? goal.title : ""}
            aria-hidden={!goal.cover_file_id}
            className="w-full h-full object-cover"
          />
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
          {isFinished && goal.updated_at && (
            <span
              data-testid="goal-item-finished-at"
              className="text-xs text-gray-400 mt-0.5 block"
            >
              {formatShortDateTime(goal.updated_at)}
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
