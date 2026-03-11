import { SHEET_NAMES, SHEET_HEADERS, colMap, coerceSheetBool } from '../helpers/constants';
import { getSheet } from './client';
import type { ChecklistItem } from '../types';

const ITEM_COLS = colMap(SHEET_NAMES.CHECKLIST_ITEMS);

function rowToItem(row: unknown[]): ChecklistItem {
  return {
    id: String(row[ITEM_COLS.id] ?? ''),
    task_id: String(row[ITEM_COLS.task_id] ?? ''),
    title: String(row[ITEM_COLS.title] ?? ''),
    is_completed: coerceSheetBool(row[ITEM_COLS.is_completed]),
    sort_order: Number(row[ITEM_COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[ITEM_COLS.is_deleted]),
    created_at: String(row[ITEM_COLS.created_at] ?? ''),
    updated_at: String(row[ITEM_COLS.updated_at] ?? ''),
    version: Number(row[ITEM_COLS.version] ?? 1),
  };
}

function itemToRow(item: ChecklistItem): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.CHECKLIST_ITEMS].map(col => (item as unknown as Record<string, unknown>)[col]);
}

export function getAllChecklistItems(): ChecklistItem[] {
  const sheet = getSheet(SHEET_NAMES.CHECKLIST_ITEMS);
  return sheet.getDataRange().getValues().slice(1).filter((row: unknown[]) => row[0]).map(rowToItem);
}

export function getChecklistItemsByVersion(minVersion: number): ChecklistItem[] {
  return getAllChecklistItems().filter(i => i.version > minVersion);
}

export function upsertChecklistItem(item: ChecklistItem): void {
  const sheet = getSheet(SHEET_NAMES.CHECKLIST_ITEMS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === item.id) {
      sheet.getRange(i + 1, 1, 1, SHEET_HEADERS[SHEET_NAMES.CHECKLIST_ITEMS].length).setValues([itemToRow(item)]);
      return;
    }
  }
  sheet.appendRow(itemToRow(item));
}

export function deleteChecklistItemsByIds(ids: string[]): number {
  const sheet = getSheet(SHEET_NAMES.CHECKLIST_ITEMS);
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
