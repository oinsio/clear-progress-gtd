import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useSync } from "@/app/providers/SyncProvider";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { ConfirmFullSyncDialog } from "@/components/settings/ConfirmFullSyncDialog";
import { BOX_ORDER, ACCENT_COLORS, ACCENT_COLOR_VALUES, PANEL_SIDES, ROUTES, STORAGE_KEYS, SUPPORTED_LANGUAGES, BACKEND_CONNECTION_EVENT } from "@/constants";
import type { Box, AccentColor, PanelSide } from "@/types/common";
import type { Language } from "@/constants";
import { cn } from "@/shared/lib/cn";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [filterMode, setFilterMode] = useState<RightPanelMode>(null);
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [isFullSyncDialogOpen, setIsFullSyncDialogOpen] = useState(false);
  const { triggerFullSync } = useSync();

  const navigate = useNavigate();
  const { defaultBox, setDefaultBox } = useSettings();
  const { accentColor, setAccentColor } = useTheme();
  const { panelSide, setPanelSide } = usePanelSide();
  const { language, setLanguage } = useLanguage();

  const handlePanelToggle = togglePanelOpen;

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode !== null) {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      } else {
        setFilterMode(newMode);
      }
    },
    [navigate],
  );

  const handleBoxSelect = (box: Box): void => {
    void setDefaultBox(box);
  };

  const handleColorSelect = (color: AccentColor): void => {
    void setAccentColor(color);
  };

  const handlePanelSideSelect = (side: PanelSide): void => {
    setPanelSide(side);
  };

  const handleLanguageSelect = (lang: Language): void => {
    setLanguage(lang);
  };

  const [isBackendConnected, setIsBackendConnected] = useState(
    !!localStorage.getItem(STORAGE_KEYS.GAS_URL),
  );

  const handleDisconnect = (): void => {
    localStorage.removeItem(STORAGE_KEYS.GAS_URL);
    window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));
    setIsBackendConnected(false);
  };

  const handleFullSyncOpen = useCallback((): void => {
    setIsFullSyncDialogOpen(true);
  }, []);

  const handleFullSyncClose = useCallback((): void => {
    setIsFullSyncDialogOpen(false);
  }, []);

  return (
    <div data-testid="settings-page" className="relative flex h-screen overflow-hidden bg-white">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
            <h1 className="text-xl font-semibold text-gray-900">{t("settings.title")}</h1>

            {/* Default box section */}
            <section data-testid="settings-default-box" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.defaultBox")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {BOX_ORDER.map((box) => (
                  <button
                    key={box}
                    data-testid={`settings-box-option-${box}`}
                    aria-pressed={defaultBox === box}
                    onClick={() => handleBoxSelect(box)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      defaultBox === box
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {t(`box.${box}`)}
                  </button>
                ))}
              </div>
            </section>

            {/* Accent color section */}
            <section data-testid="settings-accent-color" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.accentColor")}
              </h2>
              <div className="flex gap-4">
                {ACCENT_COLORS.map((color) => {
                  const isSelected = accentColor === color;
                  return (
                    <button
                      key={color}
                      data-testid={`settings-color-option-${color}`}
                      aria-pressed={isSelected}
                      aria-label={t(`color.${color}`)}
                      onClick={() => handleColorSelect(color)}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all",
                        isSelected && "ring-2 ring-offset-2 ring-gray-400 scale-110",
                      )}
                      style={{ backgroundColor: ACCENT_COLOR_VALUES[color] }}
                    />
                  );
                })}
              </div>
            </section>
            {/* Panel side section */}
            <section data-testid="settings-panel-side" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.panelSide")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {PANEL_SIDES.map((side) => (
                  <button
                    key={side}
                    data-testid={`settings-panel-side-option-${side}`}
                    aria-pressed={panelSide === side}
                    onClick={() => handlePanelSideSelect(side)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      panelSide === side
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {side === "left" ? t("settings.panelLeft") : t("settings.panelRight")}
                  </button>
                ))}
              </div>
            </section>

            {/* Language section */}
            <section data-testid="settings-language" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.language")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    data-testid={`settings-language-option-${lang}`}
                    aria-pressed={language === lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      language === lang
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {t(`lang.${lang}`)}
                  </button>
                ))}
              </div>
            </section>

            {/* Sync section */}
            <section data-testid="settings-sync" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.syncSection")}
              </h2>
              <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isBackendConnected ? "bg-green-500" : "bg-gray-300",
                    )}
                  />
                  <span
                    data-testid="settings-sync-status"
                    className={cn(
                      "text-sm font-medium",
                      isBackendConnected ? "text-green-600" : "text-gray-400",
                    )}
                  >
                    {isBackendConnected ? t("settings.syncConnected") : t("settings.syncNotConnected")}
                  </span>
                </div>
                {isBackendConnected ? (
                  <>
                    <button
                      data-testid="settings-full-sync-btn"
                      onClick={handleFullSyncOpen}
                      className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors"
                    >
                      {t("settings.fullSync")}
                    </button>
                    <button
                      data-testid="settings-sync-disconnect"
                      onClick={handleDisconnect}
                      className="w-full text-sm font-medium text-red-500 transition-colors hover:text-red-600"
                    >
                      {t("settings.syncDisconnect")}
                    </button>
                  </>
                ) : (
                  <button
                    data-testid="settings-sync-connect"
                    onClick={() => navigate(ROUTES.SETUP)}
                    className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors"
                  >
                    {t("settings.syncConnect")}
                  </button>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <ConfirmFullSyncDialog
        isOpen={isFullSyncDialogOpen}
        onClose={handleFullSyncClose}
        onSync={triggerFullSync}
      />

      {/* Right panel — same as on main page */}
      <RightFilterPanel
        mode={filterMode}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
