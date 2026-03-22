import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import type { FullSyncStep } from "@/types/common";
import { cn } from "@/shared/lib/cn";

interface ConfirmFullSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (onProgress: (step: FullSyncStep) => void) => Promise<void>;
}

const PROGRESS_STEPS: Array<{ key: "push" | "pull" | "covers"; labelKey: string; testId: string }> = [
  { key: "push", labelKey: "settings.fullSyncStepPush", testId: "full-sync-step-push" },
  { key: "pull", labelKey: "settings.fullSyncStepPull", testId: "full-sync-step-pull" },
  { key: "covers", labelKey: "settings.fullSyncStepCovers", testId: "full-sync-step-covers" },
];

const STEP_ORDER: FullSyncStep[] = ["push", "pull", "covers"];

function isStepDone(currentStep: FullSyncStep, stepKey: "push" | "pull" | "covers"): boolean {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const stepIndex = STEP_ORDER.indexOf(stepKey);
  return currentIndex > stepIndex || currentStep === "done";
}

export function ConfirmFullSyncDialog({ isOpen, onClose, onSync }: ConfirmFullSyncDialogProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<FullSyncStep>("idle");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleStart = useCallback(async () => {
    setIsSyncing(true);
    setCurrentStep("idle");

    const onProgress = (step: FullSyncStep) => {
      setCurrentStep(step);
    };

    await onSync(onProgress);
    setIsSyncing(false);
  }, [onSync]);

  const handleClose = useCallback(() => {
    setCurrentStep("idle");
    setIsSyncing(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const isFinished = currentStep === "done" || currentStep === "error";
  const isInProgress = isSyncing || (currentStep !== "idle" && !isFinished);

  return (
    <div data-testid="full-sync-dialog" className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        data-testid="full-sync-dialog-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={!isInProgress && !isFinished ? handleClose : undefined}
      />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2
          data-testid="full-sync-dialog-title"
          className="text-base font-semibold text-gray-900 mb-2"
        >
          {t("settings.fullSyncConfirmTitle")}
        </h2>

        {currentStep === "idle" && (
          <p
            data-testid="full-sync-dialog-description"
            className="text-sm text-gray-500 mb-6"
          >
            {t("settings.fullSyncConfirmDescription")}
          </p>
        )}

        {(isInProgress || isFinished) && (
          <ul className="space-y-3 my-4">
            {PROGRESS_STEPS.map((progressStep) => {
              const isActive = currentStep === progressStep.key;
              const isDone = isStepDone(currentStep, progressStep.key);

              return (
                <li
                  key={progressStep.key}
                  data-testid={progressStep.testId}
                  data-active={isActive}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    isDone ? "bg-green-100 text-green-600" :
                    isActive ? "bg-accent/10 text-accent" :
                    "bg-gray-100 text-gray-400",
                  )}>
                    {isDone ? (
                      <Check className="h-3 w-3" />
                    ) : isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span className={cn(
                    isDone ? "text-gray-500" :
                    isActive ? "text-gray-900 font-medium" :
                    "text-gray-400",
                  )}>
                    {t(progressStep.labelKey)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {currentStep === "done" && (
          <p
            data-testid="full-sync-success"
            className="text-sm text-green-600 font-medium mt-2"
          >
            {t("settings.fullSyncSuccess")}
          </p>
        )}

        {currentStep === "error" && (
          <p
            data-testid="full-sync-error"
            className="text-sm text-red-500 font-medium mt-2"
          >
            {t("settings.fullSyncError")}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          {isFinished ? (
            <button
              data-testid="full-sync-close-btn"
              onClick={handleClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {t("settings.fullSyncClose")}
            </button>
          ) : (
            <>
              <button
                data-testid="full-sync-cancel-btn"
                onClick={handleClose}
                disabled={isInProgress}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                {t("settings.fullSyncCancel")}
              </button>
              <button
                data-testid="full-sync-start-btn"
                onClick={() => void handleStart()}
                disabled={isInProgress}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("settings.fullSyncStart")
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
