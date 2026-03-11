import { SHEET_NAMES, coerceSheetBool, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecord, deleteRecordsByIds } from './base';
import type { Context } from '../types';

const COLS = colMap(SHEET_NAMES.CONTEXTS);

function rowToContext(row: unknown[]): Context {
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

export const getAllContexts = (): Context[] => getAllRecords(SHEET_NAMES.CONTEXTS, rowToContext);
export const getContextsByVersion = (minVersion: number): Context[] => getAllContexts().filter(ctx => ctx.version > minVersion);
export const upsertContext = (ctx: Context): void => upsertRecord(SHEET_NAMES.CONTEXTS, ctx);
export const deleteContextsByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.CONTEXTS, ids);
