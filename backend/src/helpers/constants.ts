const APP_NAME = 'clear_progress';
const API_VERSION = '1.0';

const SHEET_NAMES = {
  TASKS: 'Tasks',
  GOALS: 'Goals',
  CONTEXTS: 'Contexts',
  CATEGORIES: 'Categories',
  CHECKLIST_ITEMS: 'Checklist_Items',
  SETTINGS: 'Settings',
} as const;

const DRIVE_FOLDER_NAMES = {
  ROOT: 'Clear_Progress',
  DATA_FILE: 'Clear_Progress_Data',
  COVERS: 'Covers',
} as const;

const DRIVE_MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
} as const;

const PROPERTY_KEYS = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  FOLDER_ID: 'FOLDER_ID',
  COVERS_FOLDER_ID: 'COVERS_FOLDER_ID',
} as const;

const SHEET_HEADERS: Record<string, string[]> = {
  [SHEET_NAMES.TASKS]: ['id', 'title', 'notes', 'box', 'goal_id', 'context_id', 'category_id', 'is_completed', 'completed_at', 'repeat_rule', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.GOALS]: ['id', 'title', 'description', 'cover_file_id', 'status', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.CONTEXTS]: ['id', 'name', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.CATEGORIES]: ['id', 'name', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.CHECKLIST_ITEMS]: ['id', 'task_id', 'title', 'is_completed', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  [SHEET_NAMES.SETTINGS]: ['key', 'value', 'updated_at'],
};

function colMap(sheetName: string): Record<string, number> {
  return Object.fromEntries(SHEET_HEADERS[sheetName].map((col, i) => [col, i]));
}

const ACTIONS = {
  PING: 'ping',
  INIT: 'init',
  PULL: 'pull',
  PUSH: 'push',
  UPLOAD_COVER: 'upload_cover',
  DELETE_COVER: 'delete_cover',
} as const;

const DRIVE_PERMISSIONS = {
  ROLE_READER: 'reader',
  TYPE_ANYONE: 'anyone',
} as const;

const DEFAULT_SETTINGS = {
  DEFAULT_BOX: { key: 'default_box', value: 'inbox' },
  ACCENT_COLOR: { key: 'accent_color', value: 'green' },
} as const;

const VALID_BOXES = ['inbox', 'today', 'week', 'later'];
const VALID_GOAL_STATUSES = ['not_started', 'in_progress', 'paused', 'completed', 'cancelled'];

const VALIDATION_MESSAGES = {
  ID_REQUIRED: 'id is required',
  TITLE_REQUIRED: 'title is required',
  UPDATED_AT_REQUIRED: 'updated_at is required',
  VERSION_NOT_NUMBER: 'version must be a number',
} as const;

const CONFLICT_RESOLUTION = {
  ACCEPT: 'accept',
  CONFLICT: 'conflict',
} as const;

const PUSH_STATUSES = {
  CREATED: 'created',
  ACCEPTED: 'accepted',
  CONFLICT: 'conflict',
} as const;

const DRIVE_QUERY_FIELDS = {
  COVER_FILES: 'files(id,description)',
  FILE_EXISTS: 'id,trashed',
} as const;

const COVER_HASH_PREFIX_LENGTH = 12;

function thumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}
