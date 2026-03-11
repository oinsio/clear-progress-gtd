import { SHEET_NAMES, coerceSheetBool, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecord, deleteRecordsByIds } from './base';
import type { Category } from '../types';

const COLS = colMap(SHEET_NAMES.CATEGORIES);

function rowToCategory(row: unknown[]): Category {
  return {
    id: String(row[COLS.id] ?? ''),
    name: String(row[COLS.name] ?? ''),
    sort_order: Number(row[COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[COLS.is_deleted]),
    created_at: String(row[COLS.created_at] ?? ''),
    updated_at: String(row[COLS.updated_at] ?? ''),
    version: Number(row[COLS.version] ?? 1),
  };
}

export const getAllCategories = (): Category[] => getAllRecords(SHEET_NAMES.CATEGORIES, rowToCategory);
export const getCategoriesByVersion = (minVersion: number): Category[] => getAllCategories().filter(cat => cat.version > minVersion);
export const upsertCategory = (category: Category): void => upsertRecord(SHEET_NAMES.CATEGORIES, category);
export const deleteCategoriesByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.CATEGORIES, ids);
