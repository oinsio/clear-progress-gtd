// Cached spreadsheet accessor within a single GAS execution

let _spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet | null = null;

function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  if (_spreadsheet) return _spreadsheet;

  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.SPREADSHEET_ID);
  if (!spreadsheetId) {
    throw new Error(ERR_NOT_INITIALIZED);
  }

  _spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return _spreadsheet;
}

function getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet not found: ${name}`);
  }
  return sheet;
}
