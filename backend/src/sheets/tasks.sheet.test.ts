import {beforeEach, describe, expect, it, vi} from 'vitest';
import {deleteTasksByIds, getAllTasks, getTasksByVersion, upsertTask} from './tasks.sheet';
import {SHEET_HEADERS, SHEET_NAMES} from '../helpers/constants';
import type {Task} from '../types';
import {getSheet} from './client';

vi.mock('./client', () => ({ getSheet: vi.fn() }));

const TASK_HEADERS = SHEET_HEADERS[SHEET_NAMES.TASKS];
const NUM_COLS = TASK_HEADERS.length;

// Column indices matching SHEET_HEADERS[TASKS] order
const COL = TASK_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

function makeTaskRow(overrides: Partial<Record<string, unknown>> = {}): unknown[] {
  const defaults: Record<string, unknown> = {
    id: 'task-1',
    title: 'Test task',
    notes: '',
    box: 'inbox',
    goal_id: '',
    context_id: '',
    category_id: '',
    is_completed: false,
    completed_at: '',
    repeat_rule: '',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
  };
  const merged = { ...defaults, ...overrides };
  return TASK_HEADERS.map(col => merged[col]);
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test task',
    notes: '',
    box: 'inbox',
    goal_id: '',
    context_id: '',
    category_id: '',
    is_completed: false,
    completed_at: '',
    repeat_rule: '',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

function makeSheetMock(rows: unknown[][] = []) {
  const setValuesMock = vi.fn();
    return {
      getDataRange: vi.fn().mockReturnValue({getValues: vi.fn().mockReturnValue(rows)}),
      getRange: vi.fn().mockReturnValue({setValues: setValuesMock}),
      appendRow: vi.fn(),
      deleteRow: vi.fn(),
      _setValues: setValuesMock,
  };
}

describe('getAllTasks', () => {
  it('should return empty array when sheet has only a header row', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toEqual([]);
  });

  it('should return empty array when sheet has no rows at all', () => {
    const sheetMock = makeSheetMock([]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = TASK_HEADERS.map(() => '');
    const sheetMock = makeSheetMock([TASK_HEADERS, emptyRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toEqual([]);
  });

  it('should return one task when sheet has one data row', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow()]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toHaveLength(1);
  });

  it('should return multiple tasks', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-1' }),
      makeTaskRow({ id: 'task-2' }),
      makeTaskRow({ id: 'task-3' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toHaveLength(3);
  });

  it('should correctly map all string fields from row', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({
        id: 'task-abc',
        title: 'My title',
        notes: 'Some notes',
        goal_id: 'goal-1',
        context_id: 'ctx-1',
        category_id: 'cat-1',
        completed_at: '2025-06-01T00:00:00.000Z',
        repeat_rule: 'FREQ=DAILY',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-03-01T00:00:00.000Z',
      }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const [task] = getAllTasks();
    expect(task.id).toBe('task-abc');
    expect(task.title).toBe('My title');
    expect(task.notes).toBe('Some notes');
    expect(task.goal_id).toBe('goal-1');
    expect(task.context_id).toBe('ctx-1');
    expect(task.category_id).toBe('cat-1');
    expect(task.completed_at).toBe('2025-06-01T00:00:00.000Z');
    expect(task.repeat_rule).toBe('FREQ=DAILY');
    expect(task.created_at).toBe('2025-01-01T00:00:00.000Z');
    expect(task.updated_at).toBe('2025-03-01T00:00:00.000Z');
  });

  it('should map numeric fields sort_order and version', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ sort_order: 5, version: 7 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const [task] = getAllTasks();
    expect(task.sort_order).toBe(5);
    expect(task.version).toBe(7);
  });

  it('should coerce boolean true for is_completed', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ is_completed: true })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_completed).toBe(true);
  });

  it('should coerce string "TRUE" for is_completed', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ is_completed: 'TRUE' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_completed).toBe(true);
  });

  it('should coerce false for is_completed when value is not TRUE', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ is_completed: 'false' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_completed).toBe(false);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ is_deleted: 'TRUE' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_deleted).toBe(true);
  });

  it('should default box to "inbox" for invalid box value', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ box: 'invalid_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].box).toBe('inbox');
  });

  it('should accept valid box values', () => {
    for (const box of ['inbox', 'today', 'week', 'later']) {
      const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ box })]);
      vi.mocked(getSheet).mockReturnValue(sheetMock as never);

      expect(getAllTasks()[0].box).toBe(box);
    }
  });

  it('should coerce null row values to empty string for string fields', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({
        title: null,
        notes: null,
        goal_id: null,
        context_id: null,
        category_id: null,
        completed_at: null,
        repeat_rule: null,
        created_at: null,
        updated_at: null,
      }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const [task] = getAllTasks();
    expect(task.title).toBe('');
    expect(task.notes).toBe('');
    expect(task.goal_id).toBe('');
    expect(task.context_id).toBe('');
    expect(task.category_id).toBe('');
    expect(task.completed_at).toBe('');
    expect(task.repeat_rule).toBe('');
    expect(task.created_at).toBe('');
    expect(task.updated_at).toBe('');
  });

  it('should call getSheet with Tasks sheet name', () => {
    const sheetMock = makeSheetMock([]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    getAllTasks();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});

describe('getTasksByVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tasks with version strictly greater than minVersion', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-1', version: 3 }),
      makeTaskRow({ id: 'task-2', version: 5 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const tasks = getTasksByVersion(2);
    expect(tasks.map(t => t.id)).toEqual(['task-1', 'task-2']);
  });

  it('should not return tasks with version equal to minVersion', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1', version: 5 })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByVersion(5)).toHaveLength(0);
  });

  it('should not return tasks with version less than minVersion', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1', version: 3 })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByVersion(5)).toHaveLength(0);
  });

  it('should return all tasks when minVersion is 0', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-1', version: 1 }),
      makeTaskRow({ id: 'task-2', version: 2 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByVersion(0)).toHaveLength(2);
  });

  it('should return empty array when no tasks match', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ version: 1 })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByVersion(10)).toEqual([]);
  });
});

describe('upsertTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call appendRow when task id is not found in sheet', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertTask(makeTask({ id: 'task-new' }));

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new task', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertTask(makeTask({ id: 'task-new' }));

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with task data in correct column order', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);
    const task = makeTask({ id: 'task-new', title: 'New task', version: 2 });

    upsertTask(task);

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.id]).toBe('task-new');
    expect(appendedRow[COL.title]).toBe('New task');
    expect(appendedRow[COL.version]).toBe(2);
  });

  it('should call getRange and setValues when task id already exists', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertTask(makeTask({ id: 'task-1', title: 'Updated title' }));

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing task', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertTask(makeTask({ id: 'task-1' }));

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    // Header at index 0, task at index 1 → sheet row 2
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertTask(makeTask({ id: 'task-1' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });

  it('should update the correct row when target is the third data row', () => {
    // Header, task-1, task-2, task-3 → task-3 is at sheet row 4
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-1' }),
      makeTaskRow({ id: 'task-2' }),
      makeTaskRow({ id: 'task-3' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertTask(makeTask({ id: 'task-3' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_COLS);
  });

  it('should write updated task data when updating existing row', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1', title: 'Old title' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertTask(makeTask({ id: 'task-1', title: 'New title' }));

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[COL.title]).toBe('New title');
  });
});

describe('deleteTasksByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when ids array is empty', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteTasksByIds([])).toBe(0);
  });

  it('should return 0 when no rows match the given ids', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteTasksByIds(['task-nonexistent'])).toBe(0);
  });

  it('should return count of deleted rows', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-1' }),
      makeTaskRow({ id: 'task-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteTasksByIds(['task-1', 'task-2'])).toBe(2);
  });

  it('should call deleteRow for each matched id', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-1' }),
      makeTaskRow({ id: 'task-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(['task-1', 'task-2']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it('should not call deleteRow for rows not in the ids list', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-keep' }),
      makeTaskRow({ id: 'task-delete' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(['task-delete']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it('should delete rows in reverse order to preserve row indices', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: 'task-1' }),  // row 2
      makeTaskRow({ id: 'task-2' }),  // row 3
      makeTaskRow({ id: 'task-3' }),  // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(['task-1', 'task-2', 'task-3']);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(call => call[0] as number);
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it('should delete the correct 1-based row index', () => {
    // Header at index 0, task at index 1 → sheet row 2
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ id: 'task-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(['task-1']);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});