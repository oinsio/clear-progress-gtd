import { SHEET_NAMES, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecords, deleteRecordsByIds, rowToNamedEntity } from './base';
import type { Category } from '../types';

const COLS = colMap(SHEET_NAMES.CATEGORIES);

const rowToCategory = (row: unknown[]): Category => rowToNamedEntity(row, COLS);

export const getAllCategories = (): Category[] => getAllRecords(SHEET_NAMES.CATEGORIES, rowToCategory);
export const getCategoriesByVersion = (minVersion: number): Category[] => getAllCategories().filter(cat => cat.version > minVersion);
export const upsertCategories = (categories: Category[]): void => upsertRecords(SHEET_NAMES.CATEGORIES, categories);
export const deleteCategoriesByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.CATEGORIES, ids);
