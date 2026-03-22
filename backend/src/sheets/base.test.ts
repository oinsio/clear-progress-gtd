/// <reference lib="esnext" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordToRow, getAllRecords, upsertRecord, upsertRecords, deleteRecordsByIds } from './base';
import { SHEET_HEADERS, SHEET_NAMES } from '../helpers/constants';
import { getSheet } from './client';

vi.mock('./client', () => ({ getSheet: vi.fn() }));

const TASK_HEADERS = SHEET_HEADERS[SHEET_NAMES.TASKS];
const NUM_TASK_COLS = TASK_HEADERS.length;

const TASK_COL = TASK_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

function makeSheetMock(rows: unknown[][] = []) {
  const setValuesMock = vi.fn();
  return {
    getDataRange: vi.fn().mockReturnValue({ getValues: vi.fn().mockReturnValue(rows) }),
    getRange: vi.fn().mockReturnValue({ setValues: setValuesMock }),
    appendRow: vi.fn(),
    deleteRow: vi.fn(),
    _setValues: setValuesMock,
  };
}

function makeTaskRow(id: string, overrides: Record<string, unknown> = {}): unknown[] {
  const row = Array(NUM_TASK_COLS).fill('');
  row[TASK_COL.id] = id;
  for (const [key, value] of Object.entries(overrides)) {
    row[TASK_COL[key]] = value;
  }
  return row;
}

function setupSheet(rows: unknown[][] = []) {
  const sheetMock = makeSheetMock(rows);
  vi.mocked(getSheet).mockReturnValue(sheetMock as never);
  return sheetMock;
}

function setupSheetWithTasks(...ids: string[]) {
  return setupSheet([TASK_HEADERS, ...ids.map(id => makeTaskRow(id))]);
}

// --- recordToRow ---

describe('recordToRow', () => {
  it('should return array with length equal to header count', () => {
    const record = { id: 'task-1', title: 'Test' };
    const row = recordToRow(SHEET_NAMES.TASKS, record);
    expect(row).toHaveLength(NUM_TASK_COLS);
  });

  it('should place field values at correct column indices', () => {
    const record = { id: 'abc', title: 'Hello', version: 5 };
    const row = recordToRow(SHEET_NAMES.TASKS, record);
    expect(row[TASK_COL.id]).toBe('abc');
    expect(row[TASK_COL.title]).toBe('Hello');
    expect(row[TASK_COL.version]).toBe(5);
  });

  it('should place undefined for fields not present in record', () => {
    const record = { id: 'abc' };
    const row = recordToRow(SHEET_NAMES.TASKS, record);
    expect(row[TASK_COL.title]).toBeUndefined();
  });
});

// --- getAllRecords ---

describe('getAllRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when sheet has only a header row', () => {
    setupSheet([TASK_HEADERS]);

    expect(getAllRecords(SHEET_NAMES.TASKS, row => row)).toEqual([]);
  });

  it('should return empty array when sheet has no rows at all', () => {
    setupSheet([]);

    expect(getAllRecords(SHEET_NAMES.TASKS, row => row)).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = TASK_HEADERS.map(() => '');
    setupSheet([TASK_HEADERS, emptyRow]);

    expect(getAllRecords(SHEET_NAMES.TASKS, row => row)).toHaveLength(0);
  });

  it('should call rowMapper for each non-empty data row', () => {
    const dataRow = makeTaskRow('task-1');
    setupSheet([TASK_HEADERS, dataRow]);
    const rowMapper = vi.fn().mockReturnValue({ id: 'task-1' });

    getAllRecords(SHEET_NAMES.TASKS, rowMapper);

    expect(rowMapper).toHaveBeenCalledTimes(1);
    expect(rowMapper).toHaveBeenCalledWith(dataRow);
  });

  it('should return mapped values from rowMapper', () => {
    setupSheet([TASK_HEADERS, makeTaskRow('task-1')]);
    const mappedRecord = { id: 'task-1', title: 'mapped' };
    const rowMapper = vi.fn().mockReturnValue(mappedRecord);

    const records = getAllRecords(SHEET_NAMES.TASKS, rowMapper);

    expect(records).toEqual([mappedRecord]);
  });

  it('should call getSheet with the given sheet name', () => {
    setupSheet([]);

    getAllRecords(SHEET_NAMES.TASKS, row => row);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});

// --- upsertRecord ---

describe('upsertRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call appendRow when id is not found in sheet', () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id' });

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new record', () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id' });

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with record data in correct column order', () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id', title: 'My task', version: 3 });

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[TASK_COL.id]).toBe('new-id');
    expect(appendedRow[TASK_COL.title]).toBe('My task');
    expect(appendedRow[TASK_COL.version]).toBe(3);
  });

  it('should call getRange and setValues when id already exists', () => {
    const sheetMock = setupSheetWithTasks('task-1');

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1', title: 'Updated' });

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing record', () => {
    const sheetMock = setupSheetWithTasks('task-1');

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1' });

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    // Header at index 0, record at index 1 → sheet row 2
    const sheetMock = setupSheetWithTasks('task-1');

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1' });

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_TASK_COLS);
  });

  it('should update the correct row when target is the third data row', () => {
    const sheetMock = setupSheetWithTasks('task-1', 'task-2', 'task-3');

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-3' });

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_TASK_COLS);
  });

  it('should write updated record data when updating existing row', () => {
    const sheetMock = setupSheet([TASK_HEADERS, makeTaskRow('task-1', { title: 'Old title' })]);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1', title: 'New title' });

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[TASK_COL.title]).toBe('New title');
  });

  it('should call getSheet with the given sheet name', () => {
    setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id' });

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});

// --- upsertRecords ---

describe('upsertRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do nothing when records array is empty', () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, []);

    expect(sheetMock.getDataRange).not.toHaveBeenCalled();
    expect(sheetMock.appendRow).not.toHaveBeenCalled();
    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should read the sheet exactly once regardless of record count', () => {
    const sheetMock = setupSheetWithTasks('task-1', 'task-2', 'task-3');

    upsertRecords(SHEET_NAMES.TASKS, [
      { id: 'task-1' },
      { id: 'task-2' },
      { id: 'task-3' },
    ]);

    expect(sheetMock.getDataRange).toHaveBeenCalledTimes(1);
  });

  it('should call appendRow for each new record when sheet is empty', () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: 'new-1' }, { id: 'new-2' }, { id: 'new-3' }]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(3);
  });

  it('should not call setValues when all records are new', () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: 'new-1' }, { id: 'new-2' }]);

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should call setValues once for all existing record updates', () => {
    const sheetMock = setupSheetWithTasks('task-1', 'task-2', 'task-3');

    upsertRecords(SHEET_NAMES.TASKS, [
      { id: 'task-1', title: 'A' },
      { id: 'task-2', title: 'B' },
      { id: 'task-3', title: 'C' },
    ]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should write the full data range including header on update', () => {
    // 1 header + 2 data rows = 3 total rows
    const sheetMock = setupSheetWithTasks('task-1', 'task-2');

    upsertRecords(SHEET_NAMES.TASKS, [{ id: 'task-1' }]);

    expect(sheetMock.getRange).toHaveBeenCalledWith(1, 1, 3, NUM_TASK_COLS);
  });

  it('should write updated data into the correct row index', () => {
    const sheetMock = setupSheet([
      TASK_HEADERS,
      makeTaskRow('task-1', { title: 'Old' }),
      makeTaskRow('task-2', { title: 'Keep' }),
    ]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: 'task-1', title: 'New' }]);

    const writtenMatrix = sheetMock._setValues.mock.calls[0][0] as unknown[][];
    expect(writtenMatrix[1][TASK_COL.title]).toBe('New');
    expect(writtenMatrix[2][TASK_COL.title]).toBe('Keep');
  });

  it('should handle mixed batch: update existing + append new', () => {
    const sheetMock = setupSheetWithTasks('task-existing');

    upsertRecords(SHEET_NAMES.TASKS, [
      { id: 'task-existing', title: 'Updated' },
      { id: 'task-new', title: 'Created' },
    ]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should append new rows with correct data', () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: 'task-new', title: 'My new task', version: 7 }]);

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[TASK_COL.id]).toBe('task-new');
    expect(appendedRow[TASK_COL.title]).toBe('My new task');
    expect(appendedRow[TASK_COL.version]).toBe(7);
  });

  it('should call getSheet with the given sheet name', () => {
    setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: 'x' }]);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});

// --- deleteRecordsByIds ---

describe('deleteRecordsByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when ids array is empty', () => {
    setupSheetWithTasks('task-1');

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, [])).toBe(0);
  });

  it('should return 0 when no rows match the given ids', () => {
    setupSheetWithTasks('task-1');

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-nonexistent'])).toBe(0);
  });

  it('should return count of deleted rows', () => {
    setupSheetWithTasks('task-1', 'task-2');

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1', 'task-2'])).toBe(2);
  });

  it('should call deleteRow for each matched id', () => {
    const sheetMock = setupSheetWithTasks('task-1', 'task-2');

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1', 'task-2']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it('should not call deleteRow for rows not in the ids list', () => {
    const sheetMock = setupSheetWithTasks('task-keep', 'task-delete');

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-delete']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it('should delete rows in reverse order to preserve row indices', () => {
    const sheetMock = setupSheetWithTasks('task-1', 'task-2', 'task-3'); // rows 2, 3, 4

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1', 'task-2', 'task-3']);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(call => call[0] as number);
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it('should delete the correct 1-based row index', () => {
    // Header at index 0, record at index 1 → sheet row 2
    const sheetMock = setupSheetWithTasks('task-1');

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1']);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });

  it('should call getSheet with the given sheet name', () => {
    setupSheet([]);

    deleteRecordsByIds(SHEET_NAMES.TASKS, []);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});