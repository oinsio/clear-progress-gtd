import { getSheet } from './client';
import type { Category } from '../types/index';

const SHEET = 'Categories';

function rowToCategory(row: unknown[]): Category {
  return {
    id: String(row[0] ?? ''),
    name: String(row[1] ?? ''),
    sort_order: Number(row[2] ?? 0),
    is_deleted: row[3] === true || row[3] === 'TRUE',
    created_at: String(row[4] ?? ''),
    updated_at: String(row[5] ?? ''),
    version: Number(row[6] ?? 1),
  };
}

function categoryToRow(cat: Category): unknown[] {
  return [cat.id, cat.name, cat.sort_order, cat.is_deleted, cat.created_at, cat.updated_at, cat.version];
}

export function getAll(): Category[] {
  const sheet = getSheet(SHEET);
  return sheet.getDataRange().getValues().slice(1).filter(row => row[0]).map(rowToCategory);
}

export function getByVersion(minVersion: number): Category[] {
  return getAll().filter(c => c.version > minVersion);
}

export function upsert(cat: Category): void {
  const sheet = getSheet(SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === cat.id) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([categoryToRow(cat)]);
      return;
    }
  }
  sheet.appendRow(categoryToRow(cat));
}

export function bulkUpsert(categories: Category[]): void {
  categories.forEach(upsert);
}