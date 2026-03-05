import { getSheet } from './client';
import type { Task } from '../types/index';

const SHEET = 'Tasks';
const COLUMNS = [
  'id', 'title', 'notes', 'box', 'goal_id', 'context_id', 'category_id',
  'is_completed', 'completed_at', 'repeat_rule', 'sort_order',
  'is_deleted', 'created_at', 'updated_at', 'version',
];

function rowToTask(row: unknown[]): Task {
  return {
    id: String(row[0] ?? ''),
    title: String(row[1] ?? ''),
    notes: String(row[2] ?? ''),
    box: String(row[3] ?? 'inbox') as Task['box'],
    goal_id: String(row[4] ?? ''),
    context_id: String(row[5] ?? ''),
    category_id: String(row[6] ?? ''),
    is_completed: row[7] === true || row[7] === 'TRUE',
    completed_at: String(row[8] ?? ''),
    repeat_rule: String(row[9] ?? ''),
    sort_order: Number(row[10] ?? 0),
    is_deleted: row[11] === true || row[11] === 'TRUE',
    created_at: String(row[12] ?? ''),
    updated_at: String(row[13] ?? ''),
    version: Number(row[14] ?? 1),
  };
}

function taskToRow(task: Task): unknown[] {
  return [
    task.id, task.title, task.notes, task.box,
    task.goal_id, task.context_id, task.category_id,
    task.is_completed, task.completed_at, task.repeat_rule,
    task.sort_order, task.is_deleted, task.created_at,
    task.updated_at, task.version,
  ];
}

export function getAll(): Task[] {
  const sheet = getSheet(SHEET);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter(row => row[0]).map(rowToTask);
}

export function getByVersion(minVersion: number): Task[] {
  return getAll().filter(t => t.version > minVersion);
}

export function upsert(task: Task): void {
  const sheet = getSheet(SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === task.id) {
      const row = i + 1;
      sheet.getRange(row, 1, 1, COLUMNS.length).setValues([taskToRow(task)]);
      return;
    }
  }

  sheet.appendRow(taskToRow(task));
}

export function bulkUpsert(tasks: Task[]): void {
  tasks.forEach(upsert);
}