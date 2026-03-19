import React, { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RepeatRule, RepeatRuleType } from "@/types/common";
import { REPEAT_RULE_TYPE } from "@/constants";
import { cn } from "@/shared/lib/cn";
import { formatRepeatRuleLabel } from "@/utils/repeatRule";

interface RepeatRuleSelectorProps {
  value: RepeatRule | null;
  onChange: (rule: RepeatRule | null) => void;
  onBack: () => void;
}

const MIN_REPEAT_INTERVAL = 1;
const MAX_REPEAT_INTERVAL = 365;
const DEFAULT_REPEAT_INTERVAL = 1;

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

type SelectorView = "main" | "weekly" | "interval";

const REPEAT_OPTIONS: Array<{ type: RepeatRuleType | "none" }> = [
  { type: "none" },
  { type: REPEAT_RULE_TYPE.DAILY },
  { type: REPEAT_RULE_TYPE.WEEKDAYS },
  { type: REPEAT_RULE_TYPE.WEEKLY },
  { type: REPEAT_RULE_TYPE.MONTHLY },
  { type: REPEAT_RULE_TYPE.INTERVAL },
];

export function RepeatRuleSelector({ value, onChange, onBack }: RepeatRuleSelectorProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<SelectorView>("main");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    value?.type === "weekly" ? (value.days ?? []) : [],
  );
  const [intervalValue, setIntervalValue] = useState<number>(
    value?.type === "interval" ? (value.interval ?? DEFAULT_REPEAT_INTERVAL) : DEFAULT_REPEAT_INTERVAL,
  );

  const handleOptionClick = useCallback(
    (type: RepeatRuleType | "none") => {
      if (type === "none") {
        onChange(null);
        onBack();
      } else if (type === REPEAT_RULE_TYPE.WEEKLY) {
        setView("weekly");
      } else if (type === REPEAT_RULE_TYPE.INTERVAL) {
        setView("interval");
      } else {
        onChange({ type });
        onBack();
      }
    },
    [onChange, onBack],
  );

  const handleDayToggle = useCallback((day: number) => {
    setSelectedDays((previous) =>
      previous.includes(day) ? previous.filter((d) => d !== day) : [...previous, day],
    );
  }, []);

  const handleWeeklyApply = useCallback(() => {
    onChange({ type: "weekly", days: selectedDays });
    onBack();
  }, [onChange, onBack, selectedDays]);

  const handleIntervalApply = useCallback(() => {
    onChange({ type: "interval", interval: intervalValue });
    onBack();
  }, [onChange, onBack, intervalValue]);

  const handleIntervalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(event.target.value, 10);
      if (!isNaN(parsed)) {
        setIntervalValue(Math.min(MAX_REPEAT_INTERVAL, Math.max(MIN_REPEAT_INTERVAL, parsed)));
      }
    },
    [],
  );

  const handlePickerBack = useCallback(() => {
    setView("main");
  }, []);

  const isCurrentType = (type: RepeatRuleType | "none"): boolean => {
    if (type === "none") return value === null;
    return value?.type === type;
  };

  if (view === "weekly") {
    return (
      <div data-testid="repeat-weekly-picker">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
          <button
            type="button"
            data-testid="repeat-picker-back"
            onClick={handlePickerBack}
            aria-label={t("taskEdit.back")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">{t("repeat.weekly")}</h2>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex gap-2 justify-center flex-wrap">
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  data-testid={`repeat-day-${day}`}
                  aria-pressed={isSelected}
                  onClick={() => handleDayToggle(day)}
                  className={cn(
                    "w-10 h-10 rounded-full text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  )}
                >
                  {t(`repeat.day${day}`)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            data-testid="repeat-weekly-apply"
            onClick={handleWeeklyApply}
            className="w-full py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity"
          >
            {t("repeat.applyWeekly")}
          </button>
        </div>
      </div>
    );
  }

  if (view === "interval") {
    return (
      <div data-testid="repeat-interval-picker">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100">
          <button
            type="button"
            data-testid="repeat-picker-back"
            onClick={handlePickerBack}
            aria-label={t("taskEdit.back")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">{t("taskEdit.fieldRepeat")}</h2>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <input
            type="number"
            data-testid="repeat-interval-input"
            value={intervalValue}
            min={MIN_REPEAT_INTERVAL}
            max={MAX_REPEAT_INTERVAL}
            onChange={handleIntervalChange}
            className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
          />
          <button
            type="button"
            data-testid="repeat-interval-apply"
            onClick={handleIntervalApply}
            className="w-full py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity"
          >
            {t("repeat.applyInterval")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 flex flex-col gap-1">
      {REPEAT_OPTIONS.map(({ type }) => (
        <button
          key={type}
          type="button"
          data-testid={`repeat-option-${type}`}
          aria-pressed={isCurrentType(type)}
          onClick={() => handleOptionClick(type)}
          className={cn(
            "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
            isCurrentType(type)
              ? "bg-accent/10 text-accent font-medium"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          {type === "none"
            ? t("repeat.none")
            : type === REPEAT_RULE_TYPE.INTERVAL && value?.type === REPEAT_RULE_TYPE.INTERVAL
              ? formatRepeatRuleLabel(value, t)
              : type === REPEAT_RULE_TYPE.INTERVAL
                ? t("repeat.intervalLabel")
                : t(`repeat.${type}`)}
        </button>
      ))}
    </div>
  );
}
