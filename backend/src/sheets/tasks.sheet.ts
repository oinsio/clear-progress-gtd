import { SHEET_NAMES, SHEET_HEADERS, colMap, coerceSheetBool, coerceSheetBox } from '../helpers/constants';
import { getSheet } from './client';
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

function taskToRow(task: Task): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.TASKS].map(col => (task as unknown as Record<string, unknown>)[col]);
}

export function getAllTasks(): Task[] {
  const sheet = getSheet(SHEET_NAMES.TASKS);
  const data: unknown[][] = sheet.getDataRange().getValues();
  return data.slice(1).filter((row: unknown[]) => row[0]).map(rowToTask);
}

export function getTasksByVersion(minVersion: number): Task[] {
  return getAllTasks().filter(t => t.version > minVersion);
}

export function upsertTask(task: Task): void {
  const sheet = getSheet(SHEET_NAMES.TASKS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === task.id) {
      const row = i + 1;
      sheet.getRange(row, 1, 1, SHEET_HEADERS[SHEET_NAMES.TASKS].length).setValues([taskToRow(task)]);
      return;
    }
  }

  sheet.appendRow(taskToRow(task));
}

export function deleteTasksByIds(ids: string[]): number {
  const sheet = getSheet(SHEET_NAMES.TASKS);
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