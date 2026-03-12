import type { Box, GoalStatus } from '../types';

export const APP_NAME = 'clear_progress';
export const API_VERSION = '1.0';

export const SHEET_NAMES = {
  TASKS: 'Tasks',
  GOALS: 'Goals',
  CONTEXTS: 'Contexts',
  CATEGORIES: 'Categories',
  CHECKLIST_ITEMS: 'Checklist_Items',
  SETTINGS: 'Settings',
} as const;

export const DRIVE_FOLDER_NAMES = {
  ROOT: 'Clear_Progress',
  DATA_FILE: 'Clear_Progress_Data',
  COVERS: 'Covers',
} as const;

export const DRIVE_MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
} as const;

export const PROPERTY_KEYS = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  FOLDER_ID: 'FOLDER_ID',
  COVERS_FOLDER_ID: 'COVERS_FOLDER_ID',
} as const;

export const SHEET_HEADERS: Record<string, string[]> = {
  [SHEET_NAMES.TASKS]: ['id', 'title', 'notes', 'box', 'goal_id', 'context_id', 'category_id', 'is_completed', 'completed_at', 'repeat_rule', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.GOALS]: ['id', 'title', 'description', 'cover_file_id', 'status', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.CONTEXTS]: ['id', 'name', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.CATEGORIES]: ['id', 'name', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.CHECKLIST_ITEMS]: ['id', 'task_id', 'title', 'is_completed', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.SETTINGS]: ['key', 'value', 'updated_at'],
};

export function colMap(sheetName: string): Record<string, number> {
  return Object.fromEntries(SHEET_HEADERS[sheetName].map((col, i) => [col, i]));
}

export const ACTIONS = {
  PING: 'ping',
  INIT: 'init',
  PULL: 'pull',
  PUSH: 'push',
  UPLOAD_COVER: 'upload_cover',
  DELETE_COVER: 'delete_cover',
  PURGE: 'purge',
} as const;

export const DRIVE_PERMISSIONS = {
  ROLE_READER: 'reader',
  TYPE_ANYONE: 'anyone',
} as const;

export const DEFAULT_SETTINGS = {
  DEFAULT_BOX: { key: 'default_box', value: 'inbox' },
  ACCENT_COLOR: { key: 'accent_color', value: 'green' },
} as const;

export const VALID_BOXES = ['inbox', 'today', 'week', 'later'];
export const VALID_GOAL_STATUSES = ['not_started', 'in_progress', 'paused', 'completed', 'cancelled'];

export const CONFLICT_RESOLUTION = {
  ACCEPT: 'accept',
  CONFLICT: 'conflict',
} as const;

export const PUSH_STATUSES = {
  CREATED: 'created',
  ACCEPTED: 'accepted',
  CONFLICT: 'conflict',
  REJECTED: 'rejected',
} as const;

export const DRIVE_QUERY_FIELDS = {
  COVER_FILES: 'files(id,description)',
  FILE_EXISTS: 'id,trashed',
} as const;

export const COVER_HASH_PREFIX_LENGTH = 12;
export const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_COVER_EXTENSION = 'jpg';

export const DEFAULT_TASK_BOX = 'inbox';
export const DEFAULT_GOAL_STATUS = 'not_started';

export const SHEET_BOOL_TRUE = 'TRUE';

export function coerceSheetBool(value: unknown): boolean {
  return value === true || value === SHEET_BOOL_TRUE;
}

export function coerceSheetBox(value: unknown): Box {
  const str = String(value ?? DEFAULT_TASK_BOX);
  return VALID_BOXES.includes(str) ? (str as Box) : (DEFAULT_TASK_BOX as Box);
}

export function coerceSheetGoalStatus(value: unknown): GoalStatus {
  const str = String(value ?? DEFAULT_GOAL_STATUS);
  return VALID_GOAL_STATUSES.includes(str) ? (str as GoalStatus) : (DEFAULT_GOAL_STATUS as GoalStatus);
}

export function buildFolderQuery(folderId: string): string {
  return `'${folderId}' in parents and trashed = false`;
}

export const ERROR_MESSAGES = {
  UNKNOWN_ACTION: 'Unknown action',
  INVALID_JSON: 'Request body must be valid JSON',
  COVER_TOO_LARGE: 'Cover image must be 2 MB or less',
  FILE_ID_REQUIRED: 'file_id is required',
  FILE_NOT_FOUND: 'File not found',
  SHEET_NOT_FOUND: 'Sheet not found',
  INIT_REQUIRED: 'Call init before using the API',
  PURGE_CONFIRM_REQUIRED: 'confirm must be true to purge deleted records',
  BLANK_TITLE: 'title or name must not be blank',
  INVALID_ID: 'id must be a valid UUID v4',
  INVALID_OPTIONAL_FK: 'foreign key must be empty or a valid UUID v4',
  INVALID_REQUIRED_FK: 'task_id is required and must be a valid UUID v4',
} as const;

export function isBlankString(value: string): boolean {
  return value.trim().length === 0;
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return typeof value === 'string' && UUID_V4_REGEX.test(value);
}

export function thumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}