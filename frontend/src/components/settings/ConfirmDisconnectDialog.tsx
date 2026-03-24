import { useTranslation } from "react-i18next";

interface ConfirmDisconnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDisconnectDialog({ isOpen, onClose, onConfirm }: ConfirmDisconnectDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div data-testid="disconnect-dialog" className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        data-testid="disconnect-dialog-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2
          data-testid="disconnect-dialog-title"
          className="text-base font-semibold text-gray-900 mb-2"
        >
          {t("settings.disconnectConfirmTitle")}
        </h2>
        <p
          data-testid="disconnect-dialog-description"
          className="text-sm text-gray-500 mb-6"
        >
          {t("settings.disconnectConfirmDescription")}
        </p>
        <div className="flex justify-end gap-2">
          <button
            data-testid="disconnect-cancel-btn"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {t("settings.disconnectCancel")}
          </button>
          <button
            data-testid="disconnect-confirm-btn"
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            {t("settings.disconnectConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
