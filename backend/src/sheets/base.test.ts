/// <reference lib="esnext" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordToRow, getAllRecords, upsertRecord, deleteRecordsByIds } from './base';
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
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllRecords(SHEET_NAMES.TASKS, row => row)).toEqual([]);
  });

  it('should return empty array when sheet has no rows at all', () => {
    const sheetMock = makeSheetMock([]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllRecords(SHEET_NAMES.TASKS, row => row)).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = TASK_HEADERS.map(() => '');
    const sheetMock = makeSheetMock([TASK_HEADERS, emptyRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllRecords(SHEET_NAMES.TASKS, row => row)).toHaveLength(0);
  });

  it('should call rowMapper for each non-empty data row', () => {
    const dataRow = ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')];
    const sheetMock = makeSheetMock([TASK_HEADERS, dataRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);
    const rowMapper = vi.fn().mockReturnValue({ id: 'task-1' });

    getAllRecords(SHEET_NAMES.TASKS, rowMapper);

    expect(rowMapper).toHaveBeenCalledTimes(1);
    expect(rowMapper).toHaveBeenCalledWith(dataRow);
  });

  it('should return mapped values from rowMapper', () => {
    const dataRow = ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')];
    const sheetMock = makeSheetMock([TASK_HEADERS, dataRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);
    const mappedRecord = { id: 'task-1', title: 'mapped' };
    const rowMapper = vi.fn().mockReturnValue(mappedRecord);

    const records = getAllRecords(SHEET_NAMES.TASKS, rowMapper);

    expect(records).toEqual([mappedRecord]);
  });

  it('should call getSheet with the given sheet name', () => {
    const sheetMock = makeSheetMock([]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

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
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id' });

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new record', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id' });

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with record data in correct column order', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id', title: 'My task', version: 3 });

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[TASK_COL.id]).toBe('new-id');
    expect(appendedRow[TASK_COL.title]).toBe('My task');
    expect(appendedRow[TASK_COL.version]).toBe(3);
  });

  it('should call getRange and setValues when id already exists', () => {
    const existingRow = ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')];
    const sheetMock = makeSheetMock([TASK_HEADERS, existingRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1', title: 'Updated' });

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing record', () => {
    const existingRow = ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')];
    const sheetMock = makeSheetMock([TASK_HEADERS, existingRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1' });

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    // Header at index 0, record at index 1 → sheet row 2
    const existingRow = ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')];
    const sheetMock = makeSheetMock([TASK_HEADERS, existingRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1' });

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_TASK_COLS);
  });

  it('should update the correct row when target is the third data row', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')],
      ['task-2', ...Array(NUM_TASK_COLS - 1).fill('')],
      ['task-3', ...Array(NUM_TASK_COLS - 1).fill('')],
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-3' });

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_TASK_COLS);
  });

  it('should write updated record data when updating existing row', () => {
    const existingRow = ['task-1', 'Old title', ...Array(NUM_TASK_COLS - 2).fill('')];
    const sheetMock = makeSheetMock([TASK_HEADERS, existingRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'task-1', title: 'New title' });

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[TASK_COL.title]).toBe('New title');
  });

  it('should call getSheet with the given sheet name', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertRecord(SHEET_NAMES.TASKS, { id: 'new-id' });

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});

// --- deleteRecordsByIds ---

describe('deleteRecordsByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when ids array is empty', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')]]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, [])).toBe(0);
  });

  it('should return 0 when no rows match the given ids', () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')]]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-nonexistent'])).toBe(0);
  });

  it('should return count of deleted rows', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')],
      ['task-2', ...Array(NUM_TASK_COLS - 1).fill('')],
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1', 'task-2'])).toBe(2);
  });

  it('should call deleteRow for each matched id', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')],
      ['task-2', ...Array(NUM_TASK_COLS - 1).fill('')],
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1', 'task-2']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it('should not call deleteRow for rows not in the ids list', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      ['task-keep', ...Array(NUM_TASK_COLS - 1).fill('')],
      ['task-delete', ...Array(NUM_TASK_COLS - 1).fill('')],
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-delete']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it('should delete rows in reverse order to preserve row indices', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')], // row 2
      ['task-2', ...Array(NUM_TASK_COLS - 1).fill('')], // row 3
      ['task-3', ...Array(NUM_TASK_COLS - 1).fill('')], // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1', 'task-2', 'task-3']);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(call => call[0] as number);
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it('should delete the correct 1-based row index', () => {
    // Header at index 0, record at index 1 → sheet row 2
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      ['task-1', ...Array(NUM_TASK_COLS - 1).fill('')],
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteRecordsByIds(SHEET_NAMES.TASKS, ['task-1']);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });

  it('should call getSheet with the given sheet name', () => {
    const sheetMock = makeSheetMock([]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteRecordsByIds(SHEET_NAMES.TASKS, []);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});