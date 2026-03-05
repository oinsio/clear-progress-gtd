import { jsonOk } from '../helpers/response';
import { initDefaults } from '../sheets/settings.sheet';

const FOLDER_NAME = 'Clear Progress';
const FILE_NAME = 'Clear Progress Data';
const COVERS_FOLDER_NAME = 'Covers';

const SHEET_HEADERS: Record<string, string[]> = {
  Tasks: ['id', 'title', 'notes', 'box', 'goal_id', 'context_id', 'category_id', 'is_completed', 'completed_at', 'repeat_rule', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  Goals: ['id', 'title', 'description', 'cover_file_id', 'status', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  Contexts: ['id', 'name', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  Categories: ['id', 'name', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  Checklist_Items: ['id', 'task_id', 'title', 'is_completed', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version'],
  Settings: ['key', 'value', 'updated_at'],
};

export function init(): GoogleAppsScript.Content.TextOutput {
  const props = PropertiesService.getScriptProperties();
  const existingSpreadsheetId = props.getProperty('SPREADSHEET_ID');

  if (existingSpreadsheetId) {
    return jsonOk({ created: false, spreadsheet_id: existingSpreadsheetId });
  }

  // Create folder structure
  const rootFolder = DriveApp.createFolder(FOLDER_NAME);
  const coversFolder = rootFolder.createFolder(COVERS_FOLDER_NAME);

  // Create spreadsheet
  const spreadsheet = SpreadsheetApp.create(FILE_NAME);
  DriveApp.getFileById(spreadsheet.getId()).moveTo(rootFolder);

  // Create sheets with headers
  const defaultSheet = spreadsheet.getSheets()[0];
  const sheetNames = Object.keys(SHEET_HEADERS);

  sheetNames.forEach((name, index) => {
    let sheet: GoogleAppsScript.Spreadsheet.Sheet;
    if (index === 0) {
      sheet = defaultSheet;
      sheet.setName(name);
    } else {
      sheet = spreadsheet.insertSheet(name);
    }
    sheet.getRange(1, 1, 1, SHEET_HEADERS[name].length).setValues([SHEET_HEADERS[name]]);
  });

  // Save IDs
  props.setProperties({
    SPREADSHEET_ID: spreadsheet.getId(),
    FOLDER_ID: rootFolder.getId(),
    COVERS_FOLDER_ID: coversFolder.getId(),
  });

  // Write default settings
  initDefaults();

  return jsonOk({ created: true, spreadsheet_id: spreadsheet.getId(), folder_id: rootFolder.getId() });
}