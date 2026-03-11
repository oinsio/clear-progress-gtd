import { PROPERTY_KEYS, ERROR_MESSAGES } from '../helpers/constants';
import { ERROR_CODES } from '../helpers/response';

// Cached spreadsheet accessor within a single GAS execution

let _spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet | null = null;

export function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  if (_spreadsheet) return _spreadsheet;

  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.SPREADSHEET_ID);
  if (!spreadsheetId) {
    throw new Error(ERROR_CODES.NOT_INITIALIZED);
  }

  _spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return _spreadsheet;
}

export function getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`${ERROR_MESSAGES.SHEET_NOT_FOUND}: ${name}`);
  }
  return sheet;
}