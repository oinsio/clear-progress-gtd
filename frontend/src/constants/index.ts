import type { Box, BoxFilter, AccentColor, PanelSide, RepeatRuleType } from "@/types/common";

export const ROUTES = {
  INBOX: "/inbox",
  TODAY: "/today",
  WEEK: "/week",
  LATER: "/later",
  GOALS: "/goals",
  GOAL: "/goals/:id",
  CATEGORIES: "/categories",
  CATEGORY: "/categories/:id",
  CONTEXTS: "/contexts",
  CONTEXT: "/contexts/:id",
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
  later: "Позже",
};

export const TASK_BOX_FILTER_ORDER: BoxFilter[] = ["today", "week", "later", "all"];

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
  GET_COVER: "get_cover",
  PURGE: "purge",
} as const;

export const SYNC_INTERVAL_MS = 5 * 60 * 1000;
export const SYNC_DEBOUNCE_MS = 15 * 1000;
export const PING_INTERVAL_MS = 30 * 1000;

export const BACKEND_CONNECTION_EVENT = "backend_connection_changed";

export const DB_NAME = "clear-progress";
export const DB_VERSION = 3;
export const LOCAL_COVER_ID_PREFIX = "local:";
export const COVER_THUMBNAIL_BASE_URL = "https://drive.google.com/thumbnail";
export const COVER_THUMBNAIL_SIZE = "w400";

export const STORAGE_KEYS = {
  GAS_URL: "gas_url",
  LAST_SYNC: "last_sync",
  ACCENT_COLOR: "accent_color",
  DEFAULT_BOX: "default_box",
  PANEL_SIDE: "panel_side",
  PANEL_OPEN: "panel_open",
  LANGUAGE: "language",
} as const;

export const SUPPORTED_LANGUAGES = ["ru", "en", "house"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";

export const SETTING_KEYS = {
  DEFAULT_BOX: "default_box",
  ACCENT_COLOR: "accent_color",
} as const;

export const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_COVER_BATCH_SIZE = 10;
export const COVER_HASH_PREFIX_LENGTH = 12;
export const DEFAULT_COVER_EXTENSION = "jpg";
export const FALLBACK_COVER_MIME_TYPE = "image/jpeg";

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
