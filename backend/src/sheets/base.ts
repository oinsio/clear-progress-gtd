import { SHEET_HEADERS } from '../helpers/constants';
import { getSheet } from './client';

export function recordToRow<T>(sheetName: string, record: T): unknown[] {
  return SHEET_HEADERS[sheetName].map(col => (record as Record<string, unknown>)[col]);
}

export function getAllRecords<T>(sheetName: string, rowMapper: (row: unknown[]) => T): T[] {
  const sheet = getSheet(sheetName);
  return sheet.getDataRange().getValues()
    .slice(1)
    .filter((row: unknown[]) => row[0])
    .map((row: unknown[]) => rowMapper(row));
}

export function upsertRecord<T extends { id: string }>(sheetName: string, record: T): void {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const row = recordToRow(sheetName, record);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === record.id) {
      sheet.getRange(i + 1, 1, 1, SHEET_HEADERS[sheetName].length).setValues([row]);
      return;
    }
  }

  sheet.appendRow(row);
}

export function deleteRecordsByIds(sheetName: string, ids: string[]): number {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const idSet = new Set(ids);

  const rowsToDelete: number[] = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (idSet.has(String(data[i][0]))) {
      rowsToDelete.push(i + 1);
    }
  }

  rowsToDelete.forEach(rowIndex => sheet.deleteRow(rowIndex));
  return rowsToDelete.length;
}