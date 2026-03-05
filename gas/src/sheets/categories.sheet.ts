import { getSheet } from './client';
import type { Category } from '../types';

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

function categoryToRow(category: Category): unknown[] {
  return [category.id, category.name, category.sort_order, category.is_deleted, category.created_at, category.updated_at, category.version];
}

export function getAll(): Category[] {
  const sheet = getSheet(SHEET);
  return sheet.getDataRange().getValues().slice(1).filter((row: any[]) => row[0]).map(rowToCategory);
}

export function getByVersion(minVersion: number): Category[] {
  return getAll().filter(c => c.version > minVersion);
}

export function upsert(category: Category): void {
  const sheet = getSheet(SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === category.id) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([categoryToRow(category)]);
      return;
    }
  }
  sheet.appendRow(categoryToRow(category));
}

export function bulkUpsert(categories: Category[]): void {
  categories.forEach(upsert);
}