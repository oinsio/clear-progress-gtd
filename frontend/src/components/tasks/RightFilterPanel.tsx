import {
  Search,
  Target,
  MapPin,
  Tag,
  CheckSquare,
  CheckCheck,
  Inbox,
  CircleUser,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import type { PanelSide } from "@/types/common";
import { ROUTES } from "@/constants";
import { useSync } from "@/app/providers/SyncProvider";
import { useBackendConnected } from "@/hooks/useBackendConnected";
import * as React from "react";

export type RightPanelMode =
  | "inbox"
  | "tasks"
  | "completed"
  | "goals"
  | "contexts"
  | "categories"
  | "search"
  | null;

interface FilterItem {
  mode: Exclude<RightPanelMode, "search" | null>;
  labelKey: string;
  Icon: React.ElementType;
  route?: string;
}

const FILTER_ITEMS: FilterItem[] = [
  { mode: "inbox", labelKey: "filter.inbox", Icon: Inbox },
  { mode: "contexts", labelKey: "filter.contexts", Icon: MapPin, route: ROUTES.CONTEXTS },
  { mode: "categories", labelKey: "filter.categories", Icon: Tag, route: ROUTES.CATEGORIES },
  { mode: "goals", labelKey: "filter.goals", Icon: Target, route: ROUTES.GOALS },
  { mode: "tasks", labelKey: "filter.tasks", Icon: CheckSquare },
  { mode: "completed", labelKey: "filter.completed", Icon: CheckCheck },
];

interface RightFilterPanelProps {
  mode: RightPanelMode;
  isOpen: boolean;
  side?: PanelSide;
  onToggle: () => void;
  onModeChange: (mode: RightPanelMode) => void;
}

export function RightFilterPanel({
  mode,
  isOpen,
  side = "right",
  onToggle,
  onModeChange,
}: RightFilterPanelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { syncStatus, pull } = useSync();
  const isBackendConnected = useBackendConnected();

  const isSyncing = syncStatus === "syncing";
  const hasSyncError = syncStatus === "error" || syncStatus === "offline";

  const syncLabel = isSyncing
    ? t("sync.syncing")
    : hasSyncError
      ? t("sync.noConnection")
      : t("sync.synced");

  const handleSyncClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    void pull();
  };

  const isLeft = side === "left";
  const panelBorder = isLeft ? "border-r border-accent/70" : "border-l border-accent/70";

  return (
    <div
      className={cn(
        "flex flex-shrink-0",
        isLeft && "order-first flex-row-reverse",
      )}
    >
      {/* Main panel */}
      {isOpen ? (
        <div
          className={cn("w-52 flex flex-col bg-accent overflow-hidden cursor-pointer", panelBorder)}
          onClick={onToggle}
          data-testid="right-panel-toggle"
          aria-label={t("filter.close")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggle()}
        >
          {/* Account / sync row */}
          <div className="flex items-center justify-between border-b border-white/20">
            {isBackendConnected ? (
              <button
                type="button"
                aria-label={t("sync.ariaLabel")}
                data-testid="right-panel-sync"
                onClick={handleSyncClick}
                className="flex-1 flex items-center gap-2 px-4 py-4 text-white hover:bg-black/15 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <RefreshCw
                    className={cn("w-5 h-5", isSyncing && "animate-spin")}
                    aria-hidden="true"
                  />
                  {hasSyncError && (
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[14px] font-bold leading-none">!</span>
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium truncate">{syncLabel}</span>
              </button>
            ) : (
              <button
                type="button"
                aria-label={t("settings.loginAriaLabel")}
                data-testid="right-panel-login"
                onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SETUP); }}
                className="flex-1 flex items-center px-4 py-4 text-white hover:bg-black/15 transition-colors"
              >
                <span className="text-base font-medium">{t("settings.login")}</span>
              </button>
            )}
            <button
              type="button"
              aria-label={t("settings.settingsAriaLabel")}
              data-testid="right-panel-account"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SETTINGS); }}
              className="flex items-center justify-center px-4 py-4 text-white hover:bg-black/15 transition-colors"
            >
              <CircleUser className="w-8 h-8" aria-hidden="true" />
            </button>
          </div>

          {/* Filter items */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto" aria-label={t("filter.open")}>
            {FILTER_ITEMS.map(({ mode: itemMode, labelKey, Icon, route }) => {
              const isActive = mode === itemMode;
              const label = t(labelKey);
              return (
                <button
                  key={itemMode}
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  data-testid={`right-filter-${itemMode}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (route) { navigate(route); } else { onModeChange(isActive ? null : itemMode); }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom actions: Search */}
          <div className="px-2 py-2 border-t border-white/25">
            <button
              type="button"
              aria-label={t("filter.search")}
              data-testid="right-filter-search"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SEARCH); }}
              className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors text-left text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Search className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>{t("filter.search")}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed strip */
        <div
          className={cn("w-14 flex flex-col items-center bg-accent overflow-hidden cursor-pointer", panelBorder)}
          onClick={onToggle}
          data-testid="right-panel-toggle"
          aria-label={t("filter.open")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggle()}
        >
          {/* Sync / login icon */}
          {isBackendConnected ? (
            <button
              type="button"
              aria-label={t("sync.ariaLabel")}
              data-testid="right-panel-sync"
              onClick={handleSyncClick}
              className="relative w-10 h-10 flex items-center justify-center mt-3 mb-1 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <RefreshCw
                className={cn("w-6 h-6", isSyncing && "animate-spin")}
                aria-hidden="true"
              />
              {hasSyncError && (
                <span className="absolute top-3.5 right-3.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[14px] font-bold leading-none">!</span>
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              aria-label={t("settings.settingsAriaLabel")}
              data-testid="right-panel-account"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SETTINGS); }}
              className="w-10 h-10 flex items-center justify-center mt-3 mb-1 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <CircleUser className="w-6 h-6" aria-hidden="true" />
            </button>
          )}

          {/* All filter icons */}
          <nav className="flex-1 flex flex-col items-center gap-1 py-1 overflow-y-auto" aria-label={t("filter.open")}>
            {FILTER_ITEMS.map(({ mode: itemMode, labelKey, Icon, route }) => {
              const isActive = mode === itemMode;
              const label = t(labelKey);
              return (
                <button
                  key={itemMode}
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  data-testid={`right-filter-${itemMode}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (route) { navigate(route); } else { onModeChange(isActive ? null : itemMode); }
                  }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </button>
              );
            })}
          </nav>

          {/* Bottom: search */}
          <div className="flex flex-col items-center py-2 border-t border-white/25">
            <button
              type="button"
              aria-label={t("filter.search")}
              data-testid="right-filter-search"
              onClick={(e) => { e.stopPropagation(); navigate(ROUTES.SEARCH); }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
