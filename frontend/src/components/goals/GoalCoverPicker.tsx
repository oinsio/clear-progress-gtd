import React, { useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";

interface GoalCoverPickerProps {
  previewSrc: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export function GoalCoverPicker({ previewSrc, onFileSelect, onRemove }: GoalCoverPickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePickerClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      // Reset input so re-selecting the same file triggers onChange
      event.target.value = "";
    },
    [onFileSelect],
  );

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        data-testid="cover-picker-button"
        aria-label={t("goal.cover.choose")}
        onClick={handlePickerClick}
        className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent/50"
      >
        {previewSrc ? (
          <img
            data-testid="cover-preview-img"
            src={previewSrc}
            alt={t("goal.cover.choose")}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            data-testid="cover-default-img"
            src={defaultCoverSvg}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
        )}
      </button>

      {previewSrc && (
        <button
          type="button"
          data-testid="cover-remove-button"
          aria-label={t("goal.cover.remove")}
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600/80 rounded-full flex items-center justify-center"
        >
          <X size={10} className="text-white" aria-hidden="true" />
        </button>
      )}

      <input
        ref={inputRef}
        data-testid="cover-file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
