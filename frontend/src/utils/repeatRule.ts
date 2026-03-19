import type { TFunction } from "i18next";
import type { RepeatRule } from "@/types/common";

export function parseRepeatRule(json: string): RepeatRule | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as RepeatRule;
  } catch {
    return null;
  }
}

export function serializeRepeatRule(rule: RepeatRule): string {
  return JSON.stringify(rule);
}

export function formatRepeatRuleLabel(rule: RepeatRule, t: TFunction): string {
  switch (rule.type) {
    case "daily":
      return t("repeat.daily");
    case "weekdays":
      return t("repeat.weekdays");
    case "weekly": {
      if (rule.days && rule.days.length > 0) {
        const dayLabels = rule.days.map((day) => t(`repeat.day${day}`)).join(", ");
        return t("repeat.weeklyDays", { days: dayLabels });
      }
      return t("repeat.weekly");
    }
    case "monthly":
      return t("repeat.monthly");
    case "interval":
      return t("repeat.interval", { count: rule.interval ?? 1 });
    default:
      return t("repeat.none");
  }
}
