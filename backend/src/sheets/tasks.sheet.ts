import { SHEET_NAMES, coerceSheetBool, coerceSheetBox, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecords, deleteRecordsByIds } from './base';
import type { Task } from '../types';

const COLS = colMap(SHEET_NAMES.TASKS);

function rowToTask(row: unknown[]): Task {
  return {
    id: String(row[COLS.id] ?? ''),
    title: String(row[COLS.title] ?? ''),
    notes: String(row[COLS.notes] ?? ''),
    box: coerceSheetBox(row[COLS.box]),
    goal_id: String(row[COLS.goal_id] ?? ''),
    context_id: String(row[COLS.context_id] ?? ''),
    category_id: String(row[COLS.category_id] ?? ''),
    is_completed: coerceSheetBool(row[COLS.is_completed]),
    completed_at: String(row[COLS.completed_at] ?? ''),
    repeat_rule: String(row[COLS.repeat_rule] ?? ''),
    sort_order: Number(row[COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[COLS.is_deleted]),
    created_at: String(row[COLS.created_at] ?? ''),
    updated_at: String(row[COLS.updated_at] ?? ''),
    version: Number(row[COLS.version] ?? 1),
  };
}

export const getAllTasks = (): Task[] => getAllRecords(SHEET_NAMES.TASKS, rowToTask);
export const getTasksByVersion = (minVersion: number): Task[] => getAllTasks().filter(task => task.version > minVersion);
export const upsertTasks = (tasks: Task[]): void => upsertRecords(SHEET_NAMES.TASKS, tasks);
export const deleteTasksByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.TASKS, ids);
