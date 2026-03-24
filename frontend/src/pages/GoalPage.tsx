import { useState, useCallback, useEffect, useRef } from "react";
import { X, CircleMinus, Pause, Square, Play, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGoal } from "@/hooks/useGoal";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";
import { GoalCoverPicker } from "@/components/goals/GoalCoverPicker";
import type { CoverService } from "@/services/CoverService";
import { defaultCoverService } from "@/services/defaultServices";

interface GoalStatusOption {
  status: GoalStatus;
  icon: LucideIcon;
}

const STATUS_OPTIONS: GoalStatusOption[] = [
  { status: "cancelled", icon: CircleMinus },
  { status: "paused", icon: Pause },
  { status: "planning", icon: Square },
  { status: "in_progress", icon: Play },
  { status: "completed", icon: Check },
];

interface GoalPageProps {
  goalId: string;
  onClose: () => void;
  coverService?: CoverService;
}

export default function GoalPage({
  goalId,
  onClose,
  coverService = defaultCoverService,
}: GoalPageProps) {
  const { t } = useTranslation();
  const { goal, isLoading, updateGoal, updateGoalStatus, deleteGoal } = useGoal(goalId);
  const { url: existingCoverUrl } = useCoverUrl(goal?.cover_file_id ?? "");

  const [title, setTitle] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [isCoverRemoved, setIsCoverRemoved] = useState(false);
  const [coverPreviewSrc, setCoverPreviewSrc] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const objectUrlRef = useRef<string | null>(null);

  const currentTitle = title ?? goal?.title ?? "";
  const currentDescription = description ?? goal?.description ?? "";
  const canSave = currentTitle.trim().length > 0 && !isSaving;

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (pendingCoverFile) {
      const url = URL.createObjectURL(pendingCoverFile);
      objectUrlRef.current = url;
      setCoverPreviewSrc(url);
    } else if (isCoverRemoved) {
      setCoverPreviewSrc(null);
    } else {
      setCoverPreviewSrc(existingCoverUrl);
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [pendingCoverFile, isCoverRemoved, existingCoverUrl]);

  const handleCoverSelect = useCallback((file: File) => {
    setPendingCoverFile(file);
    setIsCoverRemoved(false);
  }, []);

  const handleCoverRemove = useCallback(() => {
    setPendingCoverFile(null);
    setIsCoverRemoved(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const originalCoverFileId = goal?.cover_file_id ?? "";
      let newCoverFileId = originalCoverFileId;

      if (pendingCoverFile) {
        const result = await coverService.uploadCover(pendingCoverFile, goalId);
        newCoverFileId = result.file_id;
        if (originalCoverFileId && originalCoverFileId !== newCoverFileId) {
          void coverService.deleteCover(originalCoverFileId);
        }
      } else if (isCoverRemoved) {
        newCoverFileId = "";
        if (originalCoverFileId) {
          void coverService.deleteCover(originalCoverFileId);
        }
      }

      await updateGoal({
        title: currentTitle.trim(),
        description: currentDescription.trim(),
        cover_file_id: newCoverFileId,
      });
      onClose();
    } catch {
      setSaveError(t("goal.cover.uploadError"));
    } finally {
      setIsSaving(false);
    }
  }, [
    canSave,
    goal,
    goalId,
    pendingCoverFile,
    isCoverRemoved,
    coverService,
    updateGoal,
    currentTitle,
    currentDescription,
    onClose,
  ]);

  const handleStatusChange = useCallback(
    async (newStatus: GoalStatus) => {
      await updateGoalStatus(newStatus);
    },
    [updateGoalStatus],
  );

  const handleDeleteClick = useCallback(() => {
    setIsConfirmingDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteGoal();
    onClose();
  }, [deleteGoal, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  if (!isLoading && !goal) {
    return (
      <div data-testid="goal-page" className="fixed inset-0 z-50 flex items-center justify-center">
        <p data-testid="goal-not-found" className="text-gray-400 text-sm">
          {t("goal.notFound")}
        </p>
      </div>
    );
  }

  const activeStatus = goal?.status ?? "planning";

  return (
    <div data-testid="goal-page" className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{t("goal.editTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("goal.back")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Cover + Title row */}
          <div className="flex items-center gap-3">
            <GoalCoverPicker
              previewSrc={coverPreviewSrc}
              onFileSelect={handleCoverSelect}
              onRemove={handleCoverRemove}
            />
            <div className="flex-1">
              <label htmlFor="goal-edit-title" className="sr-only">
                {t("goal.titleLabel")}
              </label>
              <input
                id="goal-edit-title"
                type="text"
                value={currentTitle}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("goal.titlePlaceholder")}
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
                data-testid="goal-title-input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="goal-edit-description"
              className="text-xs font-medium text-gray-500 mb-1 block"
            >
              {t("goal.descriptionLabel")}
            </label>
            <textarea
              id="goal-edit-description"
              value={currentDescription}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("goal.descriptionPlaceholder")}
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              data-testid="goal-description-input"
            />
          </div>

          {/* Status segmented control */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              {t("goal.statusLabel")}
            </label>
            <div className="flex rounded-full border border-accent overflow-hidden">
              {STATUS_OPTIONS.map(({ status: optionStatus, icon: Icon }) => {
                const isSelected = activeStatus === optionStatus;
                return (
                  <button
                    key={optionStatus}
                    type="button"
                    aria-label={t(`goal.status.${optionStatus}`)}
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

        {/* Save error */}
        {saveError && (
          <p
            data-testid="goal-save-error"
            className="px-4 text-sm text-red-500"
          >
            {saveError}
          </p>
        )}

        {/* Footer */}
        <div className="flex gap-2 px-4 pb-6 pt-2">
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label={t("goal.delete")}
            data-testid="goal-delete-button"
            className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            {t("goal.delete")}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("goal.cancel")}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t("goal.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            aria-label={t("goal.save")}
            data-testid="goal-save-button"
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? t("goal.cover.uploading") : t("goal.save")}
          </button>
        </div>

        {/* Delete confirmation overlay */}
        {isConfirmingDelete && (
          <div
            data-testid="goal-delete-confirm"
            className="absolute inset-0 bg-white/95 rounded-t-2xl flex flex-col items-center justify-center gap-4 px-6"
          >
            <p className="text-base font-medium text-gray-800 text-center">
              {t("goal.deleteConfirmTitle")}
            </p>
            <p className="text-sm text-gray-500 text-center">{currentTitle}</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                data-testid="goal-delete-cancel"
                onClick={handleDeleteCancel}
                aria-label={t("goal.cancel")}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t("goal.cancel")}
              </button>
              <button
                type="button"
                data-testid="goal-delete-confirm-btn"
                onClick={() => void handleDeleteConfirm()}
                aria-label={t("goal.delete")}
                className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                {t("goal.delete")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
