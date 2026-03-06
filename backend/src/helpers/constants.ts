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

const COVER_HASH_PREFIX_LENGTH = 12;

function thumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}
