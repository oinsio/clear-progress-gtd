import { getSheet } from './client';
import type { ChecklistItem } from '../types';

const SHEET = 'Checklist_Items';

function rowToItem(row: unknown[]): ChecklistItem {
  return {
    id: String(row[0] ?? ''),
    task_id: String(row[1] ?? ''),
    title: String(row[2] ?? ''),
    is_completed: row[3] === true || row[3] === 'TRUE',
    sort_order: Number(row[4] ?? 0),
    is_deleted: row[5] === true || row[5] === 'TRUE',
    created_at: String(row[6] ?? ''),
    updated_at: String(row[7] ?? ''),
    version: Number(row[8] ?? 1),
  };
}

function itemToRow(item: ChecklistItem): unknown[] {
  return [
    item.id, item.task_id, item.title, item.is_completed,
    item.sort_order, item.is_deleted, item.created_at, item.updated_at, item.version,
  ];
}

export function getAll(): ChecklistItem[] {
  const sheet = getSheet(SHEET);
  return sheet.getDataRange().getValues().slice(1).filter((row: any[]) => row[0]).map(rowToItem);
}

export function getByVersion(minVersion: number): ChecklistItem[] {
  return getAll().filter(i => i.version > minVersion);
}

export function upsert(item: ChecklistItem): void {
  const sheet = getSheet(SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === item.id) {
      sheet.getRange(i + 1, 1, 1, 9).setValues([itemToRow(item)]);
      return;
    }
  }
  sheet.appendRow(itemToRow(item));
}

export function bulkUpsert(items: ChecklistItem[]): void {
  items.forEach(upsert);
}