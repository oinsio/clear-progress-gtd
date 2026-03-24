import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES, STORAGE_KEYS, BACKEND_CONNECTION_EVENT } from "@/constants";
import { parseGasInput } from "@/utils/gasUrl";
import { defaultApiClient } from "@/services/defaultServices";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { cn } from "@/shared/lib/cn";

type SetupPhase = "input" | "connecting" | "not_initialized" | "initializing" | "connected" | "error";

export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<RightPanelMode>(null);
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const { panelSide } = usePanelSide();

  const existingUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) ?? "";
  const [urlInput, setUrlInput] = useState(existingUrl);
  const [phase, setPhase] = useState<SetupPhase>(existingUrl ? "connected" : "input");
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleConnect = async (): Promise<void> => {
    const trimmedInput = urlInput.trim();
    if (!trimmedInput) return;

    const resolvedUrl = parseGasInput(trimmedInput);
    setPhase("connecting");
    setErrorMessage("");

    try {
      const response = await defaultApiClient.pingUrl(resolvedUrl);
      if (!response.ok) {
        setPhase("error");
        setErrorMessage(t("setup.errorConnection"));
        return;
      }
      localStorage.setItem(STORAGE_KEYS.GAS_URL, resolvedUrl);
      window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));
      if (response.initialized) {
        navigate(ROUTES.INBOX);
      } else {
        setPhase("not_initialized");
      }
    } catch {
      setPhase("error");
      setErrorMessage(t("setup.errorConnection"));
    }
  };

  const handleInit = async (): Promise<void> => {
    setPhase("initializing");
    setErrorMessage("");

    try {
      const response = await defaultApiClient.init();
      if (!response.ok) {
        setPhase("error");
        setErrorMessage(t("setup.errorInit"));
        return;
      }
      navigate(ROUTES.INBOX);
    } catch {
      setPhase("error");
      setErrorMessage(t("setup.errorInit"));
    }
  };

  const handleDisconnect = (): void => {
    localStorage.removeItem(STORAGE_KEYS.GAS_URL);
    window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));
    setUrlInput("");
    setPhase("input");
  };

  const isConnected = phase === "connected";
  const isLoading = phase === "connecting" || phase === "initializing";

  return (
    <div data-testid="setup-page" className="relative flex flex-1 overflow-hidden bg-white">
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
            <h1 className="text-xl font-semibold text-gray-900">{t("setup.title")}</h1>

            {isConnected ? (
              <>
                {/* Current URL section */}
                <section className="space-y-3">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                    {t("setup.connectedUrl")}
                  </h2>
                  <div
                    data-testid="setup-current-url"
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <p className="break-all font-mono text-sm text-gray-800">{existingUrl}</p>
                  </div>
                </section>

                {/* Actions section */}
                <section className="flex gap-2">
                  <button
                    data-testid="setup-disconnect-button"
                    onClick={handleDisconnect}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-300"
                  >
                    {t("setup.disconnect")}
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.INBOX)}
                    className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
                  >
                    {t("setup.goToApp")}
                  </button>
                </section>
              </>
            ) : (
              <>
                {/* URL input section */}
                <section className="space-y-3">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                    {t("setup.urlLabel")}
                  </h2>
                  <input
                    data-testid="setup-url-input"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={t("setup.urlPlaceholder")}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
                  />
                  <p className="text-xs text-gray-400">{t("setup.description")}</p>
                </section>

                {/* Status feedback */}
                {isLoading && (
                  <div data-testid="setup-loading" className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block animate-spin">⟳</span>
                    {phase === "connecting" ? t("setup.connecting") : t("setup.initializing")}
                  </div>
                )}

                {phase === "error" && (
                  <div
                    data-testid="setup-error"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Not initialized flow */}
                {phase === "not_initialized" && (
                  <section className="space-y-3">
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                      {t("setup.notInitializedHint")}
                    </div>
                    <button
                      data-testid="setup-initialize-button"
                      onClick={handleInit}
                      className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors"
                    >
                      {t("setup.initialize")}
                    </button>
                  </section>
                )}

                {/* Connect button */}
                {phase !== "not_initialized" && (
                  <section className="space-y-3">
                    <button
                      data-testid="setup-connect-button"
                      onClick={handleConnect}
                      disabled={!urlInput.trim() || isLoading}
                      className={cn(
                        "w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        urlInput.trim() && !isLoading
                          ? "bg-accent text-white"
                          : "cursor-not-allowed bg-gray-100 text-gray-400",
                      )}
                    >
                      {t("setup.connect")}
                    </button>
                    <button
                      data-testid="setup-skip-button"
                      onClick={() => navigate(ROUTES.INBOX)}
                      className="w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
                    >
                      {t("setup.skip")}
                    </button>
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <RightFilterPanel
        mode={filterMode}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
