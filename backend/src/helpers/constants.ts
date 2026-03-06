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

const PROPERTY_KEYS = {
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  FOLDER_ID: 'FOLDER_ID',
  COVERS_FOLDER_ID: 'COVERS_FOLDER_ID',
} as const;

const COVER_HASH_PREFIX_LENGTH = 12;

function thumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}
