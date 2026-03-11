import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllGoals, getGoalsByVersion, upsertGoal, getCoverFileIds, deleteGoalsByIds } from './goals.sheet';
import { SHEET_HEADERS, SHEET_NAMES } from '../helpers/constants';
import type { Goal } from '../types';
import { getSheet } from './client';

vi.mock('./client', () => ({ getSheet: vi.fn() }));

const GOAL_HEADERS = SHEET_HEADERS[SHEET_NAMES.GOALS];
const NUM_COLS = GOAL_HEADERS.length;

const COL = GOAL_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

function makeGoalRow(overrides: Partial<Record<string, unknown>> = {}): unknown[] {
  const defaults: Record<string, unknown> = {
    id: 'goal-1',
    title: 'Test goal',
    description: '',
    cover_file_id: '',
    status: 'not_started',
    sort_order: 0,
    is_deleted: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    version: 1,
  };
  const merged = { ...defaults, ...overrides };
  return GOAL_HEADERS.map(col => merged[col]);
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    title: 'Test goal',
    description: '',
    cover_file_id: '',
    status: 'not_started',
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

describe('getAllGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when sheet has only a header row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([GOAL_HEADERS]) as never);

    expect(getAllGoals()).toEqual([]);
  });

  it('should return empty array when sheet has no rows', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllGoals()).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = GOAL_HEADERS.map(() => '');
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([GOAL_HEADERS, emptyRow]) as never);

    expect(getAllGoals()).toEqual([]);
  });

  it('should return one goal when sheet has one data row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([GOAL_HEADERS, makeGoalRow()]) as never);

    expect(getAllGoals()).toHaveLength(1);
  });

  it('should return multiple goals', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1' }),
      makeGoalRow({ id: 'goal-2' }),
      makeGoalRow({ id: 'goal-3' }),
    ]) as never);

    expect(getAllGoals()).toHaveLength(3);
  });

  it('should correctly map string fields from row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({
        id: 'goal-abc',
        title: 'My goal',
        description: 'Some description',
        cover_file_id: 'drive-file-id',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-03-01T00:00:00.000Z',
      }),
    ]) as never);

    const [goal] = getAllGoals();
    expect(goal.id).toBe('goal-abc');
    expect(goal.title).toBe('My goal');
    expect(goal.description).toBe('Some description');
    expect(goal.cover_file_id).toBe('drive-file-id');
  });

  it('should map numeric fields sort_order and version', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ sort_order: 3, version: 8 }),
    ]) as never);

    const [goal] = getAllGoals();
    expect(goal.sort_order).toBe(3);
    expect(goal.version).toBe(8);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ is_deleted: 'TRUE' }),
    ]) as never);

    expect(getAllGoals()[0].is_deleted).toBe(true);
  });

  it('should coerce boolean true for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ is_deleted: true }),
    ]) as never);

    expect(getAllGoals()[0].is_deleted).toBe(true);
  });

  it('should coerce false for is_deleted when value is not TRUE', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ is_deleted: 'false' }),
    ]) as never);

    expect(getAllGoals()[0].is_deleted).toBe(false);
  });

  it('should default status to "not_started" for invalid status value', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ status: 'invalid_status' }),
    ]) as never);

    expect(getAllGoals()[0].status).toBe('not_started');
  });

  it('should accept all valid goal status values', () => {
    for (const status of ['not_started', 'in_progress', 'paused', 'completed', 'cancelled']) {
      vi.mocked(getSheet).mockReturnValue(makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ status }),
      ]) as never);

      expect(getAllGoals()[0].status).toBe(status);
    }
  });

  it('should call getSheet with Goals sheet name', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllGoals();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.GOALS);
  });
});

describe('getGoalsByVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return goals with version strictly greater than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1', version: 3 }),
      makeGoalRow({ id: 'goal-2', version: 5 }),
    ]) as never);

    const goals = getGoalsByVersion(2);
    expect(goals.map(g => g.id)).toEqual(['goal-1', 'goal-2']);
  });

  it('should not return goals with version equal to minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ version: 5 }),
    ]) as never);

    expect(getGoalsByVersion(5)).toHaveLength(0);
  });

  it('should not return goals with version less than minVersion', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ version: 3 }),
    ]) as never);

    expect(getGoalsByVersion(5)).toHaveLength(0);
  });

  it('should return all goals when minVersion is 0', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1', version: 1 }),
      makeGoalRow({ id: 'goal-2', version: 2 }),
    ]) as never);

    expect(getGoalsByVersion(0)).toHaveLength(2);
  });

  it('should return empty array when no goals match', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ version: 1 }),
    ]) as never);

    expect(getGoalsByVersion(10)).toEqual([]);
  });
});

describe('upsertGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call appendRow when goal id is not found in sheet', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertGoal(makeGoal({ id: 'goal-new' }));

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new goal', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertGoal(makeGoal({ id: 'goal-new' }));

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with goal data in correct column order', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);
    const goal = makeGoal({ id: 'goal-new', title: 'New goal', version: 4 });

    upsertGoal(goal);

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.id]).toBe('goal-new');
    expect(appendedRow[COL.title]).toBe('New goal');
    expect(appendedRow[COL.version]).toBe(4);
  });

  it('should call getRange and setValues when goal id already exists', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS, makeGoalRow({ id: 'goal-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertGoal(makeGoal({ id: 'goal-1', title: 'Updated title' }));

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing goal', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS, makeGoalRow({ id: 'goal-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertGoal(makeGoal({ id: 'goal-1' }));

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    // Header at index 0, goal at index 1 → sheet row 2
    const sheetMock = makeSheetMock([GOAL_HEADERS, makeGoalRow({ id: 'goal-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertGoal(makeGoal({ id: 'goal-1' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });

  it('should update the correct row when target is the third data row', () => {
    // Header, goal-1, goal-2, goal-3 → goal-3 is at sheet row 4
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1' }),
      makeGoalRow({ id: 'goal-2' }),
      makeGoalRow({ id: 'goal-3' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertGoal(makeGoal({ id: 'goal-3' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_COLS);
  });

  it('should write updated goal data when updating existing row', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS, makeGoalRow({ id: 'goal-1', title: 'Old title' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertGoal(makeGoal({ id: 'goal-1', title: 'New title' }));

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[COL.title]).toBe('New title');
  });
});

describe('getCoverFileIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no goals have cover_file_id', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ cover_file_id: '' }),
    ]) as never);

    expect(getCoverFileIds()).toEqual([]);
  });

  it('should return cover_file_id values of goals that have one', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1', cover_file_id: 'file-abc' }),
      makeGoalRow({ id: 'goal-2', cover_file_id: 'file-xyz' }),
    ]) as never);

    expect(getCoverFileIds()).toEqual(['file-abc', 'file-xyz']);
  });

  it('should filter out goals without cover_file_id', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1', cover_file_id: 'file-abc' }),
      makeGoalRow({ id: 'goal-2', cover_file_id: '' }),
    ]) as never);

    expect(getCoverFileIds()).toEqual(['file-abc']);
  });

  it('should return duplicate file ids when multiple goals share the same cover', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1', cover_file_id: 'file-shared' }),
      makeGoalRow({ id: 'goal-2', cover_file_id: 'file-shared' }),
    ]) as never);

    expect(getCoverFileIds()).toEqual(['file-shared', 'file-shared']);
  });

  it('should return empty array when sheet has no goals', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([GOAL_HEADERS]) as never);

    expect(getCoverFileIds()).toEqual([]);
  });
});

describe('deleteGoalsByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when ids array is empty', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS, makeGoalRow({ id: 'goal-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteGoalsByIds([])).toBe(0);
  });

  it('should return 0 when no rows match the given ids', () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS, makeGoalRow({ id: 'goal-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteGoalsByIds(['goal-nonexistent'])).toBe(0);
  });

  it('should return count of deleted rows', () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1' }),
      makeGoalRow({ id: 'goal-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteGoalsByIds(['goal-1', 'goal-2'])).toBe(2);
  });

  it('should call deleteRow for each matched id', () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1' }),
      makeGoalRow({ id: 'goal-2' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(['goal-1', 'goal-2']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it('should not call deleteRow for rows not in the ids list', () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-keep' }),
      makeGoalRow({ id: 'goal-delete' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(['goal-delete']);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it('should delete rows in reverse order to preserve row indices', () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: 'goal-1' }), // row 2
      makeGoalRow({ id: 'goal-2' }), // row 3
      makeGoalRow({ id: 'goal-3' }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(['goal-1', 'goal-2', 'goal-3']);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(call => call[0] as number);
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it('should delete the correct 1-based row index', () => {
    // Header at index 0, goal at index 1 → sheet row 2
    const sheetMock = makeSheetMock([GOAL_HEADERS, makeGoalRow({ id: 'goal-1' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(['goal-1']);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});