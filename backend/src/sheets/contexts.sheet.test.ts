import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllContexts, getContextsByVersion, upsertContext, deleteContextsByIds } from './contexts.sheet';
import { SHEET_HEADERS, SHEET_NAMES } from '../helpers/constants';
import type { Context } from '../types';
import { getSheet } from './client';

vi.mock('./client', () => ({ getSheet: vi.fn() }));

const CTX_HEADERS = SHEET_HEADERS[SHEET_NAMES.CONTEXTS];
const NUM_COLS = CTX_HEADERS.length;

const COL = CTX_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

function makeContextRow(overrides: Partial<Record<string, unknown>> = {}): unknown[] {
  const defaults: Record<string, unknown> = {
    id: 'context-1',
    name: '@Home',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
  };
  const merged = { ...defaults, ...overrides };
  return CTX_HEADERS.map(col => merged[col]);
}

function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    id: 'context-1',
    name: '@Home',
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

describe('getAllContexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when sheet has only a header row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CTX_HEADERS]) as never);

    expect(getAllContexts()).toEqual([]);
  });

  it('should return empty array when sheet has no rows', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllContexts()).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = CTX_HEADERS.map(() => '');
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CTX_HEADERS, emptyRow]) as never);

    expect(getAllContexts()).toEqual([]);
  });

  it('should return one context when sheet has one data row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CTX_HEADERS, makeContextRow()]) as never);

    expect(getAllContexts()).toHaveLength(1);
  });

  it('should return multiple contexts', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-1' }),
      makeContextRow({ id: 'ctx-2' }),
      makeContextRow({ id: 'ctx-3' }),
    ]) as never);

    expect(getAllContexts()).toHaveLength(3);
  });

  it('should correctly map string fields from row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({
        id: 'ctx-abc',
        name: '@Office',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-06-01T00:00:00.000Z',
      }),
    ]) as never);

    const [ctx] = getAllContexts();
    expect(ctx.id).toBe('ctx-abc');
    expect(ctx.name).toBe('@Office');
    expect(ctx.created_at).toBe('2025-01-01T00:00:00.000Z');
    expect(ctx.updated_at).toBe('2025-06-01T00:00:00.000Z');
  });

  it('should map numeric fields sort_order and version', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ sort_order: 2, version: 9 }),
    ]) as never);

    const [ctx] = getAllContexts();
    expect(ctx.sort_order).toBe(2);
    expect(ctx.version).toBe(9);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ is_deleted: 'TRUE' }),
    ]) as never);

    expect(getAllContexts()[0].is_deleted).toBe(true);
  });

  it('should coerce boolean true for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ is_deleted: true }),
    ]) as never);

    expect(getAllContexts()[0].is_deleted).toBe(true);
  });

  it('should coerce false for is_deleted when value is not TRUE', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ is_deleted: 'false' }),
    ]) as never);

    expect(getAllContexts()[0].is_deleted).toBe(false);
  });

  it('should call getSheet with Contexts sheet name', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllContexts();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.CONTEXTS);
  });

  it('should coerce null row values to empty string for string fields', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ name: null, created_at: null, updated_at: null }),
    ]) as never);

    const [context] = getAllContexts();
    expect(context.name).toBe('');
    expect(context.created_at).toBe('');
    expect(context.updated_at).toBe('');
  });
});

describe('getContextsByVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return contexts with version strictly greater than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-1', version: 3 }),
      makeContextRow({ id: 'ctx-2', version: 5 }),
    ]) as never);

    const contexts = getContextsByVersion(2);
    expect(contexts.map(c => c.id)).toEqual(['ctx-1', 'ctx-2']);
  });

  it('should not return contexts with version equal to minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ version: 5 }),
    ]) as never);

    expect(getContextsByVersion(5)).toHaveLength(0);
  });

  it('should not return contexts with version less than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ version: 3 }),
    ]) as never);

    expect(getContextsByVersion(5)).toHaveLength(0);
  });

  it('should return all contexts when minVersion is 0', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-1', version: 1 }),
      makeContextRow({ id: 'ctx-2', version: 2 }),
    ]) as never);

    expect(getContextsByVersion(0)).toHaveLength(2);
  });

  it('should return empty array when no contexts match', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ version: 1 }),
    ]) as never);

    expect(getContextsByVersion(10)).toEqual([]);
  });
});

describe('upsertContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call appendRow when context id is not found in sheet', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-new' }));

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new context', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-new' }));

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with context data in correct column order', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-new', name: '@Errands', version: 2 }));

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.id]).toBe('ctx-new');
    expect(appendedRow[COL.name]).toBe('@Errands');
    expect(appendedRow[COL.version]).toBe(2);
  });

  it('should call getRange and setValues when context id already exists', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS, makeContextRow({ id: 'ctx-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-1', name: 'Updated name' }));

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing context', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS, makeContextRow({ id: 'ctx-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-1' }));

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS, makeContextRow({ id: 'ctx-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-1' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });

  it('should update the correct row when target is the third data row', () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-1' }),
      makeContextRow({ id: 'ctx-2' }),
      makeContextRow({ id: 'ctx-3' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-3' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_COLS);
  });

  it('should write updated context data when updating existing row', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS, makeContextRow({ id: 'ctx-1', name: '@Home' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertContext(makeContext({ id: 'ctx-1', name: '@Work' }));

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[COL.name]).toBe('@Work');
  });
});

describe('deleteContextsByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when ids array is empty', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS, makeContextRow({ id: 'ctx-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteContextsByIds([])).toBe(0);
  });

  it('should return 0 when no rows match the given ids', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS, makeContextRow({ id: 'ctx-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteContextsByIds(['ctx-nonexistent'])).toBe(0);
  });

  it('should return count of deleted rows', () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-1' }),
      makeContextRow({ id: 'ctx-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteContextsByIds(['ctx-1', 'ctx-2'])).toBe(2);
  });

  it('should call deleteRow for each matched id', () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-1' }),
      makeContextRow({ id: 'ctx-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(['ctx-1', 'ctx-2']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it('should not call deleteRow for rows not in the ids list', () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-keep' }),
      makeContextRow({ id: 'ctx-delete' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(['ctx-delete']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it('should delete rows in reverse order to preserve row indices', () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: 'ctx-1' }), // row 2
      makeContextRow({ id: 'ctx-2' }), // row 3
      makeContextRow({ id: 'ctx-3' }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(['ctx-1', 'ctx-2', 'ctx-3']);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(call => call[0] as number);
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it('should delete the correct 1-based row index', () => {
    const sheetMock = makeSheetMock([CTX_HEADERS, makeContextRow({ id: 'ctx-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(['ctx-1']);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});