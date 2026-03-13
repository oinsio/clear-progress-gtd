import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/app/providers/ThemeProvider";
import { RightFilterPanel, type RightPanelMode } from "@/components/tasks/RightFilterPanel";
import { BOX_ORDER, BOX_FILTER_LABELS, ACCENT_COLORS, ACCENT_COLOR_VALUES, ROUTES } from "@/constants";
import type { Box, AccentColor } from "@/types/common";
import { cn } from "@/shared/lib/cn";

const ACCENT_COLOR_LABELS: Record<AccentColor, string> = {
  coral: "Коралловый",
  orange: "Оранжевый",
  yellow: "Жёлтый",
  green: "Зелёный",
  teal: "Бирюзовый",
  blue: "Синий",
  indigo: "Индиго",
  purple: "Фиолетовый",
};

export default function SettingsPage() {
  const [filterMode, setFilterMode] = useState<RightPanelMode>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const navigate = useNavigate();
  const { defaultBox, setDefaultBox } = useSettings();
  const { accentColor, setAccentColor } = useTheme();

  const handlePanelToggle = useCallback(() => {
    setIsPanelOpen((previous) => !previous);
  }, []);

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode !== null) {
        navigate(ROUTES.INBOX);
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

  return (
    <div data-testid="settings-page" className="flex h-screen overflow-hidden bg-white">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
            <h1 className="text-xl font-semibold text-gray-900">Настройки</h1>

            {/* Default box section */}
            <section data-testid="settings-default-box" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Коробочка по умолчанию
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
                    {BOX_FILTER_LABELS[box]}
                  </button>
                ))}
              </div>
            </section>

            {/* Accent color section */}
            <section data-testid="settings-accent-color" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Цвет приложения
              </h2>
              <div className="flex gap-4">
                {ACCENT_COLORS.map((color) => {
                  const isSelected = accentColor === color;
                  return (
                    <button
                      key={color}
                      data-testid={`settings-color-option-${color}`}
                      aria-pressed={isSelected}
                      aria-label={ACCENT_COLOR_LABELS[color]}
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
          </div>
        </main>
      </div>

      {/* Right panel — same as on main page */}
      <RightFilterPanel
        mode={filterMode}
        isOpen={isPanelOpen}
        goals={[]}
        contexts={[]}
        categories={[]}
        selectedGoalId={null}
        selectedContextId={null}
        selectedCategoryId={null}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
        onGoalSelect={() => undefined}
        onContextSelect={() => undefined}
        onCategorySelect={() => undefined}
      />
    </div>
  );
}
