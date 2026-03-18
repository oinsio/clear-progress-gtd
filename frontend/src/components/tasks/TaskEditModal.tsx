import { useState, useEffect, useCallback } from "react";
import { X, Inbox, ChevronRight, ArrowLeft } from "lucide-react";
import type { Task, Goal, Context, Category } from "@/types/entities";
import type { Box } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { BOX, BOX_FILTER_LABELS } from "@/constants";
import { TodayBoxIcon, WeekBoxIcon, LaterBoxIcon } from "./BoxIcons";
import * as React from "react";

interface TaskEditModalProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => void;
}

const BOX_OPTIONS: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];

const BOX_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }: { className?: string }) => <Inbox className={className} />,
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

const SELECTOR_TYPE = {
  GOAL: "goal",
  CONTEXT: "context",
  CATEGORY: "category",
} as const;

type SelectorType = (typeof SELECTOR_TYPE)[keyof typeof SELECTOR_TYPE];

const SELECTOR_TITLES: Record<SelectorType, string> = {
  [SELECTOR_TYPE.GOAL]: "Цель",
  [SELECTOR_TYPE.CONTEXT]: "Контекст",
  [SELECTOR_TYPE.CATEGORY]: "Категория",
};

export function TaskEditModal({
  task,
  goals,
  contexts,
  categories,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [selectedGoalId, setSelectedGoalId] = useState(task.goal_id);
  const [selectedContextId, setSelectedContextId] = useState(task.context_id);
  const [selectedCategoryId, setSelectedCategoryId] = useState(task.category_id);
  const [selectedBox, setSelectedBox] = useState<Box>(task.box);
  const [isSaving, setIsSaving] = useState(false);
  const [openSelector, setOpenSelector] = useState<SelectorType | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setNotes(task.notes);
      setSelectedGoalId(task.goal_id);
      setSelectedContextId(task.context_id);
      setSelectedCategoryId(task.category_id);
      setSelectedBox(task.box);
      setOpenSelector(null);
      setIsConfirmingDelete(false);
    }
  }, [isOpen, task]);

  const handleDeleteClick = useCallback(() => {
    setIsConfirmingDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(task.id);
    onClose();
  }, [task.id, onDelete, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        notes,
        goal_id: selectedGoalId,
        context_id: selectedContextId,
        category_id: selectedCategoryId,
        box: selectedBox,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [task.id, title, notes, selectedGoalId, selectedContextId, selectedCategoryId, selectedBox, onUpdate, onClose]);

  if (!isOpen) return null;

  const selectedGoalTitle = selectedGoalId
    ? (goals.find((goal) => goal.id === selectedGoalId)?.title ?? "Без цели")
    : "Без цели";

  const selectedContextName = selectedContextId
    ? (contexts.find((context) => context.id === selectedContextId)?.name ?? "Без контекста")
    : "Без контекста";

  const selectedCategoryName = selectedCategoryId
    ? (categories.find((category) => category.id === selectedCategoryId)?.name ?? "Без категории")
    : "Без категории";

  return (
    <div data-testid="task-edit-modal" className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        data-testid="task-edit-modal-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Main bottom sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Редактировать задачу</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Название</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название задачи"
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              data-testid="task-edit-title"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Заметки</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Добавить заметку..."
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              data-testid="task-edit-notes"
            />
          </div>

          {/* Box selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Коробочка</label>
            <div className="flex gap-1">
              {BOX_OPTIONS.map((box) => {
                const BoxIcon = BOX_ICONS[box];
                const isSelected = selectedBox === box;
                return (
                  <button
                    key={box}
                    type="button"
                    aria-label={BOX_FILTER_LABELS[box]}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedBox(box)}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      isSelected
                        ? "text-accent"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    <BoxIcon className="w-7 h-7" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal drill-down row */}
          {goals.length > 0 && (
            <button
              type="button"
              data-testid="task-edit-goal-row"
              onClick={() => setOpenSelector(SELECTOR_TYPE.GOAL)}
              className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
            >
              <span className="text-gray-500 font-medium">Цель</span>
              <div className="flex items-center gap-1">
                <span className={cn(selectedGoalId ? "text-gray-800" : "text-gray-400")}>
                  {selectedGoalTitle}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>
          )}

          {/* Context drill-down row */}
          {contexts.length > 0 && (
            <button
              type="button"
              data-testid="task-edit-context-row"
              onClick={() => setOpenSelector(SELECTOR_TYPE.CONTEXT)}
              className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
            >
              <span className="text-gray-500 font-medium">Контекст</span>
              <div className="flex items-center gap-1">
                <span className={cn(selectedContextId ? "text-gray-800" : "text-gray-400")}>
                  {selectedContextName}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>
          )}

          {/* Category drill-down row */}
          {categories.length > 0 && (
            <button
              type="button"
              data-testid="task-edit-category-row"
              onClick={() => setOpenSelector(SELECTOR_TYPE.CATEGORY)}
              className="flex items-center justify-between w-full py-2.5 text-sm border-b border-gray-100"
            >
              <span className="text-gray-500 font-medium">Категория</span>
              <div className="flex items-center gap-1">
                <span className={cn(selectedCategoryId ? "text-gray-800" : "text-gray-400")}>
                  {selectedCategoryName}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 px-4 pb-6 pt-2">
          <button
            type="button"
            data-testid="task-edit-delete-btn"
            onClick={handleDeleteClick}
            aria-label="Удалить задачу"
            className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            Удалить
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Отмена"
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            aria-label="Сохранить"
            disabled={!title.trim() || isSaving}
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>

        {/* Delete confirmation overlay */}
        {isConfirmingDelete && (
          <div
            data-testid="task-edit-delete-confirm"
            className="absolute inset-0 bg-white/95 rounded-t-2xl flex flex-col items-center justify-center gap-4 px-6"
          >
            <p className="text-base font-medium text-gray-800 text-center">Удалить задачу?</p>
            <p className="text-sm text-gray-500 text-center">{task.title}</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                data-testid="task-edit-delete-cancel"
                onClick={handleDeleteCancel}
                aria-label="Отмена"
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                data-testid="task-edit-delete-confirm-btn"
                onClick={handleDeleteConfirm}
                aria-label="Удалить"
                className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selector sheet — overlays the main bottom sheet */}
      {openSelector !== null && (
        <div
          data-testid="task-edit-selector-sheet"
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        >
          {/* Selector header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setOpenSelector(null)}
              aria-label="Назад"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-gray-800">
              {SELECTOR_TITLES[openSelector]}
            </h2>
          </div>

          {/* Selector list */}
          <div className="px-4 py-3 flex flex-col gap-1">
            {openSelector === SELECTOR_TYPE.GOAL && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGoalId("");
                    setOpenSelector(null);
                  }}
                  className={cn(
                    "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                    selectedGoalId === ""
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  Без цели
                </button>
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setOpenSelector(null);
                    }}
                    className={cn(
                      "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      selectedGoalId === goal.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {goal.title}
                  </button>
                ))}
              </>
            )}

            {openSelector === SELECTOR_TYPE.CONTEXT && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContextId("");
                    setOpenSelector(null);
                  }}
                  className={cn(
                    "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                    selectedContextId === ""
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  Без контекста
                </button>
                {contexts.map((context) => (
                  <button
                    key={context.id}
                    type="button"
                    onClick={() => {
                      setSelectedContextId(context.id);
                      setOpenSelector(null);
                    }}
                    className={cn(
                      "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      selectedContextId === context.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {context.name}
                  </button>
                ))}
              </>
            )}

            {openSelector === SELECTOR_TYPE.CATEGORY && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("");
                    setOpenSelector(null);
                  }}
                  className={cn(
                    "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                    selectedCategoryId === ""
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-gray-500 hover:bg-gray-100",
                  )}
                >
                  Без категории
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setOpenSelector(null);
                    }}
                    className={cn(
                      "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
                      selectedCategoryId === category.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
