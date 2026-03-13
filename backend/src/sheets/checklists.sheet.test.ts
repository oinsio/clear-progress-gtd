import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllChecklistItems, getChecklistItemsByVersion, upsertChecklistItem, deleteChecklistItemsByIds } from './checklists.sheet';
import { SHEET_HEADERS, SHEET_NAMES } from '../helpers/constants';
import type { ChecklistItem } from '../types';
import { getSheet } from './client';

vi.mock('./client', () => ({ getSheet: vi.fn() }));

const ITEM_HEADERS = SHEET_HEADERS[SHEET_NAMES.CHECKLIST_ITEMS];
const NUM_COLS = ITEM_HEADERS.length;

const COL = ITEM_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

function makeItemRow(overrides: Partial<Record<string, unknown>> = {}): unknown[] {
  const defaults: Record<string, unknown> = {
    id: 'item-1',
    task_id: 'task-1',
    title: 'Subtask',
    is_completed: false,
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
  };
  const merged = { ...defaults, ...overrides };
  return ITEM_HEADERS.map(col => merged[col]);
}

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: 'item-1',
    task_id: 'task-1',
    title: 'Subtask',
    is_completed: false,
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
    getDataRange: vi.fn().mockReturnValue({ getValues: vi.fn().mockReturnValue(rows) }),
    getRange: vi.fn().mockReturnValue({ setValues: setValuesMock }),
    appendRow: vi.fn(),
    deleteRow: vi.fn(),
    _setValues: setValuesMock,
  };
}

describe('getAllChecklistItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when sheet has only a header row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([ITEM_HEADERS]) as never);

    expect(getAllChecklistItems()).toEqual([]);
  });

  it('should return empty array when sheet has no rows', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllChecklistItems()).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = ITEM_HEADERS.map(() => '');
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([ITEM_HEADERS, emptyRow]) as never);

    expect(getAllChecklistItems()).toEqual([]);
  });

  it('should return one item when sheet has one data row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([ITEM_HEADERS, makeItemRow()]) as never);

    expect(getAllChecklistItems()).toHaveLength(1);
  });

  it('should return multiple items', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-1' }),
      makeItemRow({ id: 'item-2' }),
      makeItemRow({ id: 'item-3' }),
    ]) as never);

    expect(getAllChecklistItems()).toHaveLength(3);
  });

  it('should correctly map string fields from row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({
        id: 'item-abc',
        task_id: 'task-xyz',
        title: 'Buy milk',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-06-01T00:00:00.000Z',
      }),
    ]) as never);

    const [item] = getAllChecklistItems();
    expect(item.id).toBe('item-abc');
    expect(item.task_id).toBe('task-xyz');
    expect(item.title).toBe('Buy milk');
    expect(item.created_at).toBe('2025-01-01T00:00:00.000Z');
    expect(item.updated_at).toBe('2025-06-01T00:00:00.000Z');
  });

  it('should map numeric fields sort_order and version', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ sort_order: 3, version: 7 }),
    ]) as never);

    const [item] = getAllChecklistItems();
    expect(item.sort_order).toBe(3);
    expect(item.version).toBe(7);
  });

  it('should coerce string "TRUE" for is_completed', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ is_completed: 'TRUE' }),
    ]) as never);

    expect(getAllChecklistItems()[0].is_completed).toBe(true);
  });

  it('should coerce boolean true for is_completed', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ is_completed: true }),
    ]) as never);

    expect(getAllChecklistItems()[0].is_completed).toBe(true);
  });

  it('should coerce false for is_completed when value is not TRUE', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ is_completed: 'false' }),
    ]) as never);

    expect(getAllChecklistItems()[0].is_completed).toBe(false);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ is_deleted: 'TRUE' }),
    ]) as never);

    expect(getAllChecklistItems()[0].is_deleted).toBe(true);
  });

  it('should coerce false for is_deleted when value is not TRUE', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ is_deleted: 'false' }),
    ]) as never);

    expect(getAllChecklistItems()[0].is_deleted).toBe(false);
  });

  it('should call getSheet with Checklist_Items sheet name', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllChecklistItems();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.CHECKLIST_ITEMS);
  });

  it('should coerce null row values to empty string for string fields', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ task_id: null, title: null, created_at: null, updated_at: null }),
    ]) as never);

    const [item] = getAllChecklistItems();
    expect(item.task_id).toBe('');
    expect(item.title).toBe('');
    expect(item.created_at).toBe('');
    expect(item.updated_at).toBe('');
  });
});

describe('getChecklistItemsByVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return items with version strictly greater than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-1', version: 3 }),
      makeItemRow({ id: 'item-2', version: 5 }),
    ]) as never);

    const items = getChecklistItemsByVersion(2);
    expect(items.map(i => i.id)).toEqual(['item-1', 'item-2']);
  });

  it('should not return items with version equal to minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ version: 5 }),
    ]) as never);

    expect(getChecklistItemsByVersion(5)).toHaveLength(0);
  });

  it('should not return items with version less than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ version: 3 }),
    ]) as never);

    expect(getChecklistItemsByVersion(5)).toHaveLength(0);
  });

  it('should return all items when minVersion is 0', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-1', version: 1 }),
      makeItemRow({ id: 'item-2', version: 2 }),
    ]) as never);

    expect(getChecklistItemsByVersion(0)).toHaveLength(2);
  });

  it('should return empty array when no items match', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ version: 1 }),
    ]) as never);

    expect(getChecklistItemsByVersion(10)).toEqual([]);
  });
});

describe('upsertChecklistItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call appendRow when item id is not found in sheet', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-new' }));

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new item', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-new' }));

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with item data in correct column order', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-new', task_id: 'task-99', title: 'Call dentist', version: 3 }));

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.id]).toBe('item-new');
    expect(appendedRow[COL.task_id]).toBe('task-99');
    expect(appendedRow[COL.title]).toBe('Call dentist');
    expect(appendedRow[COL.version]).toBe(3);
  });

  it('should call getRange and setValues when item id already exists', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS, makeItemRow({ id: 'item-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-1', title: 'Updated title' }));

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing item', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS, makeItemRow({ id: 'item-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-1' }));

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS, makeItemRow({ id: 'item-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-1' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });

  it('should update the correct row when target is the third data row', () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-1' }),
      makeItemRow({ id: 'item-2' }),
      makeItemRow({ id: 'item-3' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-3' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_COLS);
  });

  it('should write updated item data when updating existing row', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS, makeItemRow({ id: 'item-1', title: 'Old title' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertChecklistItem(makeItem({ id: 'item-1', title: 'New title' }));

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[COL.title]).toBe('New title');
  });
});

describe('deleteChecklistItemsByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when ids array is empty', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS, makeItemRow({ id: 'item-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteChecklistItemsByIds([])).toBe(0);
  });

  it('should return 0 when no rows match the given ids', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS, makeItemRow({ id: 'item-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteChecklistItemsByIds(['item-nonexistent'])).toBe(0);
  });

  it('should return count of deleted rows', () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-1' }),
      makeItemRow({ id: 'item-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteChecklistItemsByIds(['item-1', 'item-2'])).toBe(2);
  });

  it('should call deleteRow for each matched id', () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-1' }),
      makeItemRow({ id: 'item-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(['item-1', 'item-2']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it('should not call deleteRow for rows not in the ids list', () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-keep' }),
      makeItemRow({ id: 'item-delete' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(['item-delete']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it('should delete rows in reverse order to preserve row indices', () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: 'item-1' }), // row 2
      makeItemRow({ id: 'item-2' }), // row 3
      makeItemRow({ id: 'item-3' }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(['item-1', 'item-2', 'item-3']);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(call => call[0] as number);
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it('should delete the correct 1-based row index', () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS, makeItemRow({ id: 'item-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(['item-1']);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});