import type { Box, AccentColor, RepeatRuleType } from "@/types/common";

export const ROUTES = {
  INBOX: "/inbox",
  TODAY: "/today",
  WEEK: "/week",
  LATER: "/later",
  GOALS: "/goals",
  GOAL: "/goals/:id",
  SEARCH: "/search",
  SETTINGS: "/settings",
  SETUP: "/setup",
} as const;

export const BOX = {
  INBOX: "inbox",
  TODAY: "today",
  WEEK: "week",
  LATER: "later",
} as const satisfies Record<string, Box>;


export const BOX_ORDER: Box[] = ["inbox", "today", "week", "later"];

export const DEFAULT_ACCENT_COLOR: AccentColor = "green";

export const ACCENT_COLORS: AccentColor[] = [
  "green",
  "orange",
  "purple",
  "yellow",
  "crimson",
];

export const ACCENT_COLOR_VALUES: Record<AccentColor, string> = {
  green: "#22c55e",
  orange: "#f97316",
  purple: "#a855f7",
  yellow: "#eab308",
  crimson: "#dc2626",
};

export const API_ACTIONS = {
  PING: "ping",
  INIT: "init",
  PULL: "pull",
  PUSH: "push",
  UPLOAD_COVER: "upload_cover",
  DELETE_COVER: "delete_cover",
  PURGE: "purge",
} as const;

export const SYNC_INTERVAL_MS = 5 * 60 * 1000;
export const SYNC_DEBOUNCE_MS = 7500;

export const DB_NAME = "clear-progress";
export const DB_VERSION = 1;

export const STORAGE_KEYS = {
  GAS_URL: "gas_url",
  LAST_SYNC: "last_sync",
} as const;

export const SETTING_KEYS = {
  DEFAULT_BOX: "default_box",
  ACCENT_COLOR: "accent_color",
} as const;

export const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024;

export const PUSH_RESULT_STATUS = {
  CREATED: "created",
  ACCEPTED: "accepted",
  CONFLICT: "conflict",
  REJECTED: "rejected",
} as const;

export const REPEAT_RULE_TYPE = {
  DAILY: "daily",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  INTERVAL: "interval",
} as const satisfies Record<string, RepeatRuleType>;
