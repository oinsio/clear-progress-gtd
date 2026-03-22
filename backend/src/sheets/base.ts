import { SHEET_HEADERS, coerceSheetBool } from '../helpers/constants';
import { getSheet } from './client';

export type NamedEntity = {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
};

export function rowToNamedEntity(row: unknown[], cols: Record<string, number>): NamedEntity {
  return {
    id: String(row[cols.id] ?? ''),
    name: String(row[cols.name] ?? ''),
    sort_order: Number(row[cols.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[cols.is_deleted]),
    created_at: String(row[cols.created_at] ?? ''),
    updated_at: String(row[cols.updated_at] ?? ''),
    version: Number(row[cols.version] ?? 1),
  };
}

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

export function upsertRecords<T extends { id: string }>(sheetName: string, records: T[]): void {
  if (records.length === 0) return;

  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const numCols = SHEET_HEADERS[sheetName].length;

  const idToRowIndex = new Map<string, number>();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) idToRowIndex.set(String(data[i][0]), i);
  }

  const updatedRows = data.map(row => [...row] as unknown[]);
  const newRows: unknown[][] = [];
  let hasUpdates = false;

  for (const record of records) {
    const row = recordToRow(sheetName, record);
    const existingIndex = idToRowIndex.get(record.id);
    if (existingIndex !== undefined) {
      updatedRows[existingIndex] = row;
      hasUpdates = true;
    } else {
      newRows.push(row);
    }
  }

  if (hasUpdates) {
    sheet.getRange(1, 1, updatedRows.length, numCols).setValues(updatedRows);
  }

  for (const newRow of newRows) {
    sheet.appendRow(newRow);
  }
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