import type { Box, BoxFilter, AccentColor, PanelSide, RepeatRuleType } from "@/types/common";

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

export const BOX_FILTER_ALL = "all" as const satisfies BoxFilter;

export const BOX_FILTER_LABELS: Record<BoxFilter, string> = {
  all: "Все",
  inbox: "Входящие",
  today: "Сегодня",
  week: "Неделя",
  later: "Потом",
};

export const BOX_FILTER_ORDER: BoxFilter[] = [
  "all",
  "inbox",
  "today",
  "week",
  "later",
];

export const DEFAULT_PANEL_SIDE: PanelSide = "right";

export const PANEL_SIDES: PanelSide[] = ["left", "right"];

export const DEFAULT_ACCENT_COLOR: AccentColor = "green";

export const ACCENT_COLORS: AccentColor[] = [
  "coral",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
];

export const ACCENT_COLOR_VALUES: Record<AccentColor, string> = {
  coral: "#fb7185",
  orange: "#f57c00",
  yellow: "#f4c943",
  green: "#69b23e",
  teal: "#0d9488",
  blue: "#2563eb",
  indigo: "#4f46e5",
  purple: "#a855f7",
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
  ACCENT_COLOR: "accent_color",
  DEFAULT_BOX: "default_box",
  PANEL_SIDE: "panel_side",
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
