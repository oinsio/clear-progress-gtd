import { useState, useCallback, useEffect, useRef } from "react";
import { FileText, GripVertical, ListChecks, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { Task, Goal, Context, Category } from "@/types/entities";
import type { Box } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { formatCompletedAt } from "@/shared/lib/utils";
import { TaskQuickActions } from "./TaskQuickActions";
import { useChecklist } from "@/hooks/useChecklist";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import * as React from "react";

export interface DragHandleProps {
  ref: (element: HTMLElement | null) => void;
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: SyntheticListenerMap | undefined;
}

interface TaskItemProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  dragHandleProps?: DragHandleProps;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function TaskItem({ task, goals, contexts, categories, onComplete, onUpdate, onMove, dragHandleProps, onSelect, isSelected }: TaskItemProps) {
  const { t } = useTranslation();
  const { progress: checklistProgress, hasUnsyncedItems } = useChecklist(task.id);
  const isTaskUnsynced = useIsUnsynced(task);
  const isUnsynced = isTaskUnsynced || hasUnsyncedItems;
  const isDesktop = useIsDesktop();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);

  useEffect(() => {
    if (isDesktop && isExpanded) {
      setIsExpanded(false);
    }
  }, [isDesktop, isExpanded]);

  const handleBodyClick = useCallback(() => {
    if (isDesktop && onSelect) {
      onSelect(task.id);
    } else {
      setIsExpanded((previous) => !previous);
    }
  }, [isDesktop, onSelect, task.id]);

  const handleOpenEdit = useCallback(() => {
    if (onSelect) {
      onSelect(task.id);
    }
    setIsExpanded(false);
  }, [onSelect, task.id]);

  const handleCompleteClick = useCallback(() => {
    if (task.is_completed) {
      setIsConfirmingRestore(true);
    } else {
      onComplete(task.id);
    }
  }, [task.is_completed, task.id, onComplete]);

  const handleRestoreConfirm = useCallback(() => {
    onComplete(task.id);
    setIsConfirmingRestore(false);
  }, [task.id, onComplete]);

  const handleRestoreCancel = useCallback(() => {
    setIsConfirmingRestore(false);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isExpanded || isConfirmingRestore) && containerRef.current) {
      containerRef.current.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    }
  }, [isExpanded, isConfirmingRestore]);

  return (
    <>
      <div
        ref={containerRef}
        data-testid="task-item"
        className={cn(
          "border-b border-gray-100 border-l-2 transition-colors hover:bg-gray-50",
          isUnsynced ? "border-l-amber-400" : isSelected ? "border-l-accent" : "border-l-transparent",
          isSelected && "bg-accent/5",
        )}
      >
        {/* Main task row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            aria-label={task.is_completed ? t("task.noncomplete") : t("task.complete")}
            onClick={handleCompleteClick}
            className={cn(
              "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors self-start mt-0.5",
              task.is_completed
                ? "bg-accent border-accent"
                : "border-gray-300 hover:border-accent",
            )}
          />
          <button
            type="button"
            data-testid="task-item-body"
            onClick={handleBodyClick}
            className="flex flex-col flex-1 min-w-0 text-left"
          >
            <span
              data-testid="task-item-title"
              className={cn(
                "text-sm",
                task.is_completed && "line-through text-gray-400",
              )}
            >
              {task.title}
            </span>
            {task.is_completed && task.completed_at && (
              <span
                data-testid="task-item-completed-at"
                className="text-xs text-accent mt-0.5"
              >
                {formatCompletedAt(task.completed_at)}
              </span>
            )}
            {(task.notes && !task.is_completed || checklistProgress.total > 0 || task.repeat_rule) && (
              <span className="flex items-center gap-2 mt-0.5">
                {task.notes && !task.is_completed && (
                  <FileText size={12} className="text-gray-400 flex-shrink-0" />
                )}
                {checklistProgress.total > 0 && (
                  <span
                    data-testid="checklist-badge"
                    className="flex items-center gap-0.5 text-gray-400"
                  >
                    <ListChecks size={10} />
                    <span className="text-[10px]">{checklistProgress.completed}/{checklistProgress.total}</span>
                  </span>
                )}
                {task.repeat_rule && (
                  <RotateCcw
                    data-testid="repeat-rule-indicator"
                    size={10}
                    className="text-gray-400 flex-shrink-0"
                  />
                )}
              </span>
            )}
          </button>
          {dragHandleProps && (
            <button
              type="button"
              ref={dragHandleProps.ref}
              aria-label={t("task.drag")}
              className="flex-shrink-0 text-gray-300 cursor-grab active:cursor-grabbing touch-none"
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
            >
              <GripVertical size={16} />
            </button>
          )}
        </div>

        {/* Restore confirmation panel */}
        {isConfirmingRestore && (
          <div
            data-testid="restore-confirmation"
            className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100"
          >
            <span className="text-sm text-gray-600">{t("task.restoreConfirm")}</span>
            <div className="flex gap-3">
              <button
                type="button"
                aria-label={t("task.cancel")}
                onClick={handleRestoreCancel}
                className="text-sm text-gray-500"
              >
                {t("task.cancel")}
              </button>
              <button
                type="button"
                aria-label={t("task.restore")}
                onClick={handleRestoreConfirm}
                className="text-sm text-accent font-medium"
              >
                {t("task.restore")}
              </button>
            </div>
          </div>
        )}

        {/* Quick actions panel */}
        {isExpanded && (
          <TaskQuickActions
            task={task}
            goals={goals}
            contexts={contexts}
            categories={categories}
            onUpdate={onUpdate}
            onMove={onMove}
            onOpenEdit={handleOpenEdit}
          />
        )}
      </div>

    </>
  );
}
