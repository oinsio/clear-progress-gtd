import { useState, useCallback, useEffect, useRef } from "react";
import { X, CircleMinus, Pause, Square, Play, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";
import { GoalCoverPicker } from "./GoalCoverPicker";
import type { CoverService } from "@/services/CoverService";
import { defaultCoverService } from "@/services/defaultServices";

const DEFAULT_GOAL_STATUS: GoalStatus = "planning";

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

export interface GoalCreateData {
  title: string;
  description: string;
  status: GoalStatus;
  cover_file_id: string;
}

interface GoalCreateSheetProps {
  onSave: (data: GoalCreateData) => Promise<void>;
  onClose: () => void;
  coverService?: CoverService;
}

export function GoalCreateSheet({
  onSave,
  onClose,
  coverService = defaultCoverService,
}: GoalCreateSheetProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<GoalStatus>(DEFAULT_GOAL_STATUS);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreviewSrc, setCoverPreviewSrc] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (pendingCoverFile) {
      const url = URL.createObjectURL(pendingCoverFile);
      objectUrlRef.current = url;
      setCoverPreviewSrc(url);
    } else {
      setCoverPreviewSrc(null);
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [pendingCoverFile]);

  const handleCoverSelect = useCallback((file: File) => {
    setPendingCoverFile(file);
  }, []);

  const handleCoverRemove = useCallback(() => {
    setPendingCoverFile(null);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setIsSaving(true);
    try {
      let coverFileId = "";
      if (pendingCoverFile) {
        const result = await coverService.uploadCover(pendingCoverFile, "");
        coverFileId = result.file_id;
      }
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        status,
        cover_file_id: coverFileId,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [title, description, status, pendingCoverFile, coverService, onSave, onClose]);

  const canSave = title.trim().length > 0 && !isSaving;

  return (
    <div data-testid="goal-create-sheet" className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        data-testid="goal-create-sheet-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{t("goal.newTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("goal.close")}
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
              <label htmlFor="goal-create-title" className="sr-only">
                {t("goal.titleLabel")}
              </label>
              <input
                id="goal-create-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("goal.titlePlaceholder")}
                autoFocus
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
                data-testid="goal-create-title-input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="goal-create-description"
              className="text-xs font-medium text-gray-500 mb-1 block"
            >
              {t("goal.descriptionLabel")}
            </label>
            <textarea
              id="goal-create-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("goal.descriptionPlaceholder")}
              rows={3}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              data-testid="goal-create-description-input"
            />
          </div>

          {/* Status segmented control */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">{t("goal.statusLabel")}</label>
            <div className="flex rounded-full border border-accent overflow-hidden">
              {STATUS_OPTIONS.map(({ status: optionStatus, icon: Icon }) => {
                const isSelected = status === optionStatus;
                return (
                  <button
                    key={optionStatus}
                    type="button"
                    aria-label={t(`goal.status.${optionStatus}`)}
                    aria-pressed={isSelected}
                    onClick={() => setStatus(optionStatus)}
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
            aria-label={t("goal.create")}
            data-testid="goal-create-save-button"
            className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? t("goal.cover.uploading") : t("goal.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
