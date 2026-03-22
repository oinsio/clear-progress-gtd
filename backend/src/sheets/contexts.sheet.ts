import { SHEET_NAMES, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecords, deleteRecordsByIds, rowToNamedEntity } from './base';
import type { Context } from '../types';

const COLS = colMap(SHEET_NAMES.CONTEXTS);

const rowToContext = (row: unknown[]): Context => rowToNamedEntity(row, COLS);

export const getAllContexts = (): Context[] => getAllRecords(SHEET_NAMES.CONTEXTS, rowToContext);
export const getContextsByVersion = (minVersion: number): Context[] => getAllContexts().filter(ctx => ctx.version > minVersion);
export const upsertContexts = (contexts: Context[]): void => upsertRecords(SHEET_NAMES.CONTEXTS, contexts);
export const deleteContextsByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.CONTEXTS, ids);
