import * as React from "react";
import { Inbox } from "lucide-react";
import type { Box } from "@/types/common";
import { BOX } from "@/constants";
import { TodayBoxIcon, WeekBoxIcon, LaterBoxIcon } from "./BoxIcons";

export const ACTIVE_TAB = {
  DETAILS: "details",
  CHECKLIST: "checklist",
} as const;

export type ActiveTab = (typeof ACTIVE_TAB)[keyof typeof ACTIVE_TAB];

export const BOX_OPTIONS: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];

export const BOX_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }: { className?: string }) => <Inbox className={className} />,
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

export const SELECTOR_TYPE = {
  GOAL: "goal",
  CONTEXT: "context",
  CATEGORY: "category",
  REPEAT: "repeat",
} as const;

export type SelectorType = (typeof SELECTOR_TYPE)[keyof typeof SELECTOR_TYPE];

export const SELECTOR_TITLE_KEYS: Record<SelectorType, string> = {
  [SELECTOR_TYPE.GOAL]: "selector.goal",
  [SELECTOR_TYPE.CONTEXT]: "selector.context",
  [SELECTOR_TYPE.CATEGORY]: "selector.category",
  [SELECTOR_TYPE.REPEAT]: "taskEdit.fieldRepeat",
};

export const CHECKLIST_ITEM_VARIANT = {
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

export type ChecklistItemVariant = (typeof CHECKLIST_ITEM_VARIANT)[keyof typeof CHECKLIST_ITEM_VARIANT];

export function resolveEntityTitle(
  id: string,
  entities: Array<{ id: string; title: string }>,
  fallback: string,
): string {
  return id ? (entities.find((entity) => entity.id === id)?.title ?? fallback) : fallback;
}

export function resolveEntityName(
  id: string,
  entities: Array<{ id: string; name: string }>,
  fallback: string,
): string {
  return id ? (entities.find((entity) => entity.id === id)?.name ?? fallback) : fallback;
}
