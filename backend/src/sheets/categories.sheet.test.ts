import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllCategories, getCategoriesByVersion, upsertCategory, deleteCategoriesByIds } from './categories.sheet';
import { SHEET_HEADERS, SHEET_NAMES } from '../helpers/constants';
import type { Category } from '../types';
import { getSheet } from './client';

vi.mock('./client', () => ({ getSheet: vi.fn() }));

const CAT_HEADERS = SHEET_HEADERS[SHEET_NAMES.CATEGORIES];
const NUM_COLS = CAT_HEADERS.length;

const COL = CAT_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

function makeCategoryRow(overrides: Partial<Record<string, unknown>> = {}): unknown[] {
  const defaults: Record<string, unknown> = {
    id: 'category-1',
    name: 'Work',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
  };
  const merged = { ...defaults, ...overrides };
  return CAT_HEADERS.map(col => merged[col]);
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'category-1',
    name: 'Work',
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

describe('getAllCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when sheet has only a header row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CAT_HEADERS]) as never);

    expect(getAllCategories()).toEqual([]);
  });

  it('should return empty array when sheet has no rows', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllCategories()).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = CAT_HEADERS.map(() => '');
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CAT_HEADERS, emptyRow]) as never);

    expect(getAllCategories()).toEqual([]);
  });

  it('should return one category when sheet has one data row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CAT_HEADERS, makeCategoryRow()]) as never);

    expect(getAllCategories()).toHaveLength(1);
  });

  it('should return multiple categories', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-1' }),
      makeCategoryRow({ id: 'cat-2' }),
      makeCategoryRow({ id: 'cat-3' }),
    ]) as never);

    expect(getAllCategories()).toHaveLength(3);
  });

  it('should correctly map string fields from row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({
        id: 'cat-abc',
        name: 'Family',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-06-01T00:00:00.000Z',
      }),
    ]) as never);

    const [category] = getAllCategories();
    expect(category.id).toBe('cat-abc');
    expect(category.name).toBe('Family');
    expect(category.created_at).toBe('2025-01-01T00:00:00.000Z');
    expect(category.updated_at).toBe('2025-06-01T00:00:00.000Z');
  });

  it('should map numeric fields sort_order and version', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ sort_order: 4, version: 6 }),
    ]) as never);

    const [category] = getAllCategories();
    expect(category.sort_order).toBe(4);
    expect(category.version).toBe(6);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ is_deleted: 'TRUE' }),
    ]) as never);

    expect(getAllCategories()[0].is_deleted).toBe(true);
  });

  it('should coerce boolean true for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ is_deleted: true }),
    ]) as never);

    expect(getAllCategories()[0].is_deleted).toBe(true);
  });

  it('should coerce false for is_deleted when value is not TRUE', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ is_deleted: 'false' }),
    ]) as never);

    expect(getAllCategories()[0].is_deleted).toBe(false);
  });

  it('should call getSheet with Categories sheet name', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllCategories();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.CATEGORIES);
  });

  it('should coerce null row values to empty string for string fields', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ name: null, created_at: null, updated_at: null }),
    ]) as never);

    const [category] = getAllCategories();
    expect(category.name).toBe('');
    expect(category.created_at).toBe('');
    expect(category.updated_at).toBe('');
  });
});

describe('getCategoriesByVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return categories with version strictly greater than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-1', version: 3 }),
      makeCategoryRow({ id: 'cat-2', version: 5 }),
    ]) as never);

    const categories = getCategoriesByVersion(2);
    expect(categories.map(c => c.id)).toEqual(['cat-1', 'cat-2']);
  });

  it('should not return categories with version equal to minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ version: 5 }),
    ]) as never);

    expect(getCategoriesByVersion(5)).toHaveLength(0);
  });

  it('should not return categories with version less than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ version: 3 }),
    ]) as never);

    expect(getCategoriesByVersion(5)).toHaveLength(0);
  });

  it('should return all categories when minVersion is 0', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-1', version: 1 }),
      makeCategoryRow({ id: 'cat-2', version: 2 }),
    ]) as never);

    expect(getCategoriesByVersion(0)).toHaveLength(2);
  });

  it('should return empty array when no categories match', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ version: 1 }),
    ]) as never);

    expect(getCategoriesByVersion(10)).toEqual([]);
  });
});

describe('upsertCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call appendRow when category id is not found in sheet', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-new' }));

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new category', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-new' }));

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with category data in correct column order', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-new', name: 'Health', version: 3 }));

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.id]).toBe('cat-new');
    expect(appendedRow[COL.name]).toBe('Health');
    expect(appendedRow[COL.version]).toBe(3);
  });

  it('should call getRange and setValues when category id already exists', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS, makeCategoryRow({ id: 'cat-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-1', name: 'Updated name' }));

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing category', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS, makeCategoryRow({ id: 'cat-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-1' }));

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS, makeCategoryRow({ id: 'cat-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-1' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });

  it('should update the correct row when target is the third data row', () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-1' }),
      makeCategoryRow({ id: 'cat-2' }),
      makeCategoryRow({ id: 'cat-3' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-3' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_COLS);
  });

  it('should write updated category data when updating existing row', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS, makeCategoryRow({ id: 'cat-1', name: 'Old name' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertCategory(makeCategory({ id: 'cat-1', name: 'New name' }));

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[COL.name]).toBe('New name');
  });
});

describe('deleteCategoriesByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when ids array is empty', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS, makeCategoryRow({ id: 'cat-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteCategoriesByIds([])).toBe(0);
  });

  it('should return 0 when no rows match the given ids', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS, makeCategoryRow({ id: 'cat-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteCategoriesByIds(['cat-nonexistent'])).toBe(0);
  });

  it('should return count of deleted rows', () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-1' }),
      makeCategoryRow({ id: 'cat-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteCategoriesByIds(['cat-1', 'cat-2'])).toBe(2);
  });

  it('should call deleteRow for each matched id', () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-1' }),
      makeCategoryRow({ id: 'cat-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(['cat-1', 'cat-2']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it('should not call deleteRow for rows not in the ids list', () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-keep' }),
      makeCategoryRow({ id: 'cat-delete' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(['cat-delete']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it('should delete rows in reverse order to preserve row indices', () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: 'cat-1' }), // row 2
      makeCategoryRow({ id: 'cat-2' }), // row 3
      makeCategoryRow({ id: 'cat-3' }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(['cat-1', 'cat-2', 'cat-3']);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(call => call[0] as number);
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it('should delete the correct 1-based row index', () => {
    const sheetMock = makeSheetMock([CAT_HEADERS, makeCategoryRow({ id: 'cat-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(['cat-1']);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});