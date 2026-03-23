import { useTranslation } from "react-i18next";
import { GoalStatusBadge } from "./GoalStatusBadge";
import type { Goal } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { formatShortDateTime } from "@/shared/lib/utils";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { cn } from "@/shared/lib/cn";
import React from "react";
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
  const { t } = useTranslation();
  const isFinished = FINISHED_GOAL_STATUSES.has(goal.status);
  const isUnsynced = useIsUnsynced(goal);
  const { url: coverUrl } = useCoverUrl(goal.cover_file_id);
  return (
    <li
      ref={nodeRef}
      style={style}
      data-testid="goal-item"
      className={cn(
        "flex items-center border-b border-gray-100 bg-white border-l-2 transition-colors hover:bg-gray-50",
        isUnsynced ? "border-l-amber-400" : "border-l-transparent",
      )}
    >
      {/* Main clickable area */}
      <button
        type="button"
        data-testid="goal-navigate-button"
        className="flex flex-1 items-center gap-3 px-4 py-3 text-left min-w-0"
        onClick={() => onNavigate(goal.id)}
      >
        {/* Cover */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            data-testid={coverUrl ? "goal-cover-img" : "goal-cover-placeholder"}
            src={coverUrl ?? defaultCoverSvg}
            alt={coverUrl ? goal.title : ""}
            aria-hidden={!coverUrl}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title + task count */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug break-words">
            {goal.title}
          </p>
          {taskCount > 0 && (
            <span
              data-testid="goal-task-count"
              className="text-xs text-gray-400 mt-0.5 block"
            >
              {t("goal.taskCount")} {taskCount}
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

        {/* Status badge — right side, inside clickable area */}
        <div className="flex-shrink-0 pl-2">
          <GoalStatusBadge status={goal.status} />
        </div>
      </button>

      {/* Drag handle (injected from parent when DnD is active) */}
      {dragHandle}
    </li>
  );
}
