import { useState, useCallback, useEffect, useRef } from "react";
import { FileText, GripVertical, ListChecks } from "lucide-react";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { Task, Goal, Context, Category } from "@/types/entities";
import type { Box } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { formatCompletedAt } from "@/shared/lib/utils";
import { TaskQuickActions } from "./TaskQuickActions";
import { TaskEditModal } from "./TaskEditModal";
import { useChecklist } from "@/hooks/useChecklist";
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
}

export function TaskItem({ task, goals, contexts, categories, onComplete, onUpdate, onMove, onDelete, dragHandleProps }: TaskItemProps) {
  const { progress: checklistProgress } = useChecklist(task.id);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);

  const handleBodyClick = useCallback(() => {
    setIsExpanded((previous) => !previous);
  }, []);

  const handleOpenEdit = useCallback(() => {
    setIsEditModalOpen(true);
    setIsExpanded(false);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

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
      <div ref={containerRef} data-testid="task-item" className="border-b border-gray-100">
        {/* Main task row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            aria-label={task.is_completed ? "Noncomplete task" : "Complete task"}
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
            {(task.notes && !task.is_completed || checklistProgress.total > 0) && (
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
              </span>
            )}
          </button>
          {dragHandleProps && (
            <button
              type="button"
              ref={dragHandleProps.ref}
              aria-label="Перетащить задачу"
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
            <span className="text-sm text-gray-600">Вернуть задачу?</span>
            <div className="flex gap-3">
              <button
                type="button"
                aria-label="Отмена"
                onClick={handleRestoreCancel}
                className="text-sm text-gray-500"
              >
                Отмена
              </button>
              <button
                type="button"
                aria-label="Вернуть"
                onClick={handleRestoreConfirm}
                className="text-sm text-accent font-medium"
              >
                Вернуть
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

      {/* Full edit modal */}
      <TaskEditModal
        task={task}
        goals={goals}
        contexts={contexts}
        categories={categories}
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  );
}
