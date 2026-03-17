import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, CircleMinus, Pause, Square, Play, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGoal } from "@/hooks/useGoal";
import { cn } from "@/shared/lib/cn";
import { ROUTES } from "@/constants";
import type { GoalStatus } from "@/types/common";

const GOAL_NOT_FOUND_MESSAGE = "Цель не найдена";
const GOAL_TITLE_PLACEHOLDER = "Название цели";
const GOAL_DESCRIPTION_PLACEHOLDER = "Добавить описание";
const CLOSE_LABEL = "Назад";
const CANCEL_LABEL = "Отмена";
const SAVE_LABEL = "Сохранить";
const PAGE_TITLE = "Редактировать цель";
const TITLE_FIELD_LABEL = "Название";
const DESCRIPTION_FIELD_LABEL = "Описание";

interface GoalStatusOption {
  status: GoalStatus;
  icon: LucideIcon;
  label: string;
}

const STATUS_OPTIONS: GoalStatusOption[] = [
  { status: "cancelled", icon: CircleMinus, label: "Отменена" },
  { status: "paused", icon: Pause, label: "На паузе" },
  { status: "planning", icon: Square, label: "Планирую" },
  { status: "in_progress", icon: Play, label: "В процессе" },
  { status: "completed", icon: Check, label: "Завершена" },
];

export default function GoalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goal, isLoading, updateGoal, updateGoalStatus } = useGoal(id ?? "");

  const [title, setTitle] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const currentTitle = title ?? goal?.title ?? "";
  const currentDescription = description ?? goal?.description ?? "";

  const canSave = currentTitle.trim().length > 0 && !isSaving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await updateGoal({ title: currentTitle.trim(), description: currentDescription.trim() });
      navigate(ROUTES.GOALS);
    } finally {
      setIsSaving(false);
    }
  }, [canSave, updateGoal, currentTitle, currentDescription, navigate]);

  const handleStatusChange = useCallback(
    async (newStatus: GoalStatus) => {
      await updateGoalStatus(newStatus);
    },
    [updateGoalStatus],
  );

  const handleClose = useCallback(() => {
    navigate(ROUTES.GOALS);
  }, [navigate]);

  if (!isLoading && !goal) {
    return (
      <div data-testid="goal-page" className="fixed inset-0 z-50 flex items-center justify-center">
        <p data-testid="goal-not-found" className="text-gray-400 text-sm">
          {GOAL_NOT_FOUND_MESSAGE}
        </p>
      </div>
    );
  }

  const activeStatus = goal?.status ?? "planning";

  return (
    <div data-testid="goal-page" className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Bottom sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{PAGE_TITLE}</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={CLOSE_LABEL}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label
              htmlFor="goal-edit-title"
              className="text-xs font-medium text-gray-500 mb-1 block"
            >
              {TITLE_FIELD_LABEL}
            </label>
            <input
              id="goal-edit-title"
              type="text"
              value={currentTitle}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={GOAL_TITLE_PLACEHOLDER}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              data-testid="goal-title-input"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="goal-edit-description"
              className="text-xs font-medium text-gray-500 mb-1 block"
            >
              {DESCRIPTION_FIELD_LABEL}
            </label>
            <textarea
              id="goal-edit-description"
              value={currentDescription}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={GOAL_DESCRIPTION_PLACEHOLDER}
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              data-testid="goal-description-input"
            />
          </div>

          {/* Status segmented control */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Статус</label>
            <div className="flex rounded-full border border-accent overflow-hidden">
              {STATUS_OPTIONS.map(({ status: optionStatus, icon: Icon, label }) => {
                const isSelected = activeStatus === optionStatus;
                return (
                  <button
                    key={optionStatus}
                    type="button"
                    aria-label={label}
                    aria-pressed={isSelected}
                    onClick={() => void handleStatusChange(optionStatus)}
                    className={cn(
                      "flex-1 flex items-center justify-center py-3 transition-colors",
                      isSelected ? "bg-accent text-white" : "text-accent bg-white hover:bg-accent/10",
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={handleClose}
            aria-label={CANCEL_LABEL}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {CANCEL_LABEL}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            aria-label={SAVE_LABEL}
            data-testid="goal-save-button"
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {SAVE_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
