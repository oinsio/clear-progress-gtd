import { SHEET_NAMES, coerceSheetBool, coerceSheetGoalStatus, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecords, deleteRecordsByIds } from './base';
import type { Goal } from '../types';

const COLS = colMap(SHEET_NAMES.GOALS);

function rowToGoal(row: unknown[]): Goal {
  return {
    id: String(row[COLS.id] ?? ''),
    title: String(row[COLS.title] ?? ''),
    description: String(row[COLS.description] ?? ''),
    cover_file_id: String(row[COLS.cover_file_id] ?? ''),
    status: coerceSheetGoalStatus(row[COLS.status]),
    sort_order: Number(row[COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[COLS.is_deleted]),
    created_at: String(row[COLS.created_at] ?? ''),
    updated_at: String(row[COLS.updated_at] ?? ''),
    version: Number(row[COLS.version] ?? 1),
  };
}

export const getAllGoals = (): Goal[] => getAllRecords(SHEET_NAMES.GOALS, rowToGoal);
export const getGoalsByVersion = (minVersion: number): Goal[] => getAllGoals().filter(goal => goal.version > minVersion);
export const upsertGoals = (goals: Goal[]): void => upsertRecords(SHEET_NAMES.GOALS, goals);
export const deleteGoalsByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.GOALS, ids);
export const getCoverFileIds = (): string[] => getAllGoals().map(goal => goal.cover_file_id).filter(Boolean);
