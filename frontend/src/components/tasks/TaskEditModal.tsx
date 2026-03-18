import { useState, useEffect, useCallback } from "react";
import { X, Inbox } from "lucide-react";
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
}

const BOX_OPTIONS: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];

const BOX_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }: { className?: string }) => <Inbox className={className} />,
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

export function TaskEditModal({
  task,
  goals,
  contexts,
  categories,
  isOpen,
  onClose,
  onUpdate,
}: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [selectedGoalId, setSelectedGoalId] = useState(task.goal_id);
  const [selectedContextId, setSelectedContextId] = useState(task.context_id);
  const [selectedCategoryId, setSelectedCategoryId] = useState(task.category_id);
  const [selectedBox, setSelectedBox] = useState<Box>(task.box);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setNotes(task.notes);
      setSelectedGoalId(task.goal_id);
      setSelectedContextId(task.context_id);
      setSelectedCategoryId(task.category_id);
      setSelectedBox(task.box);
    }
  }, [isOpen, task]);

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

  return (
    <div data-testid="task-edit-modal" className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        data-testid="task-edit-modal-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
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

          {/* Goal selector */}
          {goals.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Цель</label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedGoalId("")}
                  className={cn(
                    "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
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
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={cn(
                      "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                      selectedGoalId === goal.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {goal.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Context selector */}
          {contexts.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Контекст</label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedContextId("")}
                  className={cn(
                    "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
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
                    onClick={() => setSelectedContextId(context.id)}
                    className={cn(
                      "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                      selectedContextId === context.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {context.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category selector */}
          {categories.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Категория</label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("")}
                  className={cn(
                    "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
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
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                      selectedCategoryId === category.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 px-4 pb-6 pt-2">
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
      </div>
    </div>
  );
}
