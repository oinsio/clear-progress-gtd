import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllSettings, upsertSetting, upsertSettings, initDefaults } from './settings.sheet';
import { SHEET_HEADERS, SHEET_NAMES, DEFAULT_SETTINGS } from '../helpers/constants';
import type { Setting } from '../types';
import { getSheet } from './client';

vi.mock('./client', () => ({ getSheet: vi.fn() }));

const SET_HEADERS = SHEET_HEADERS[SHEET_NAMES.SETTINGS];
const NUM_COLS = SET_HEADERS.length;

const COL = SET_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

function makeSettingRow(overrides: Partial<Record<string, unknown>> = {}): unknown[] {
  const defaults: Record<string, unknown> = {
    key: 'default_box',
    value: 'inbox',
    updated_at: '2025-01-01T00:00:00.000Z',
  };
  const merged = { ...defaults, ...overrides };
  return SET_HEADERS.map(col => merged[col]);
}

function makeSetting(overrides: Partial<Setting> = {}): Setting {
  return {
    key: 'default_box',
    value: 'inbox',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSheetMock(rows: unknown[][] = []) {
  const setValuesMock = vi.fn();
  return {
    getDataRange: vi.fn().mockReturnValue({ getValues: vi.fn().mockReturnValue(rows) }),
    getRange: vi.fn().mockReturnValue({ setValues: setValuesMock }),
    appendRow: vi.fn(),
    _setValues: setValuesMock,
  };
}

describe('getAllSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when sheet has only a header row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([SET_HEADERS]) as never);

    expect(getAllSettings()).toEqual([]);
  });

  it('should return empty array when sheet has no rows', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllSettings()).toEqual([]);
  });

  it('should skip rows where first column is empty', () => {
    const emptyRow = SET_HEADERS.map(() => '');
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([SET_HEADERS, emptyRow]) as never);

    expect(getAllSettings()).toEqual([]);
  });

  it('should return one setting when sheet has one data row', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([SET_HEADERS, makeSettingRow()]) as never);

    expect(getAllSettings()).toHaveLength(1);
  });

  it('should return multiple settings', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'default_box', value: 'inbox' }),
      makeSettingRow({ key: 'accent_color', value: 'green' }),
    ]) as never);

    expect(getAllSettings()).toHaveLength(2);
  });

  it('should correctly map key, value and updated_at fields', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'accent_color', value: 'purple', updated_at: '2025-06-01T00:00:00.000Z' }),
    ]) as never);

    const [setting] = getAllSettings();
    expect(setting.key).toBe('accent_color');
    expect(setting.value).toBe('purple');
    expect(setting.updated_at).toBe('2025-06-01T00:00:00.000Z');
  });

  it('should return empty string for value when cell is empty', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'some_key', value: '' }),
    ]) as never);

    expect(getAllSettings()[0].value).toBe('');
  });

  it('should call getSheet with Settings sheet name', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllSettings();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.SETTINGS);
  });

  it('should return empty string for value when cell is null', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'some_key', value: null }),
    ]) as never);

    expect(getAllSettings()[0].value).toBe('');
  });

  it('should return empty string for updated_at when cell is null', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'some_key', updated_at: null }),
    ]) as never);

    expect(getAllSettings()[0].updated_at).toBe('');
  });
});

describe('upsertSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call appendRow when key is not found in sheet', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'new_key' }));

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should not call getRange when inserting a new setting', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'new_key' }));

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should append row with setting data in correct column order', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'accent_color', value: 'orange', updated_at: '2025-03-01T00:00:00.000Z' }));

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.key]).toBe('accent_color');
    expect(appendedRow[COL.value]).toBe('orange');
    expect(appendedRow[COL.updated_at]).toBe('2025-03-01T00:00:00.000Z');
  });

  it('should call getRange and setValues when key already exists', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'default_box', value: 'today' }));

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when updating an existing setting', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'default_box', value: 'today' }));

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should update the correct 1-based row index', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'default_box' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });

  it('should update the correct row when target is the second setting', () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'default_box' }),
      makeSettingRow({ key: 'accent_color' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'accent_color' }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(3, 1, 1, NUM_COLS);
  });

  it('should write updated value when updating existing setting', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box', value: 'inbox' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'default_box', value: 'today' }));

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[COL.value]).toBe('today');
  });

  it('should match by key column, not by id', () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'default_box' }),
      makeSettingRow({ key: 'accent_color' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: 'default_box', value: 'week' }));

    // Should update row 2 (default_box), not row 3 (accent_color)
    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });
});

describe('upsertSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not call getSheet when settings array is empty', () => {
    upsertSettings([]);

    expect(getSheet).not.toHaveBeenCalled();
  });

  it('should call getSheet with Settings sheet name when array is not empty', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([SET_HEADERS]) as never);

    upsertSettings([makeSetting()]);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.SETTINGS);
  });

  it('should call appendRow once for a single new setting', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'new_key' })]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should call appendRow for each new setting', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'key1' }), makeSetting({ key: 'key2' })]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(2);
  });

  it('should not call setValues when all settings are new', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'new_key' })]);

    expect(sheetMock._setValues).not.toHaveBeenCalled();
  });

  it('should call setValues when updating an existing setting', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'default_box', value: 'today' })]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it('should not call appendRow when all settings already exist', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'default_box', value: 'today' })]);

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it('should write updated value for existing setting', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box', value: 'inbox' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'default_box', value: 'today' })]);

    const writtenData = sheetMock._setValues.mock.calls[0][0] as unknown[][];
    expect(writtenData[1][COL.value]).toBe('today');
  });

  it('should preserve all rows in the batch including header row', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box', value: 'inbox' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'default_box', value: 'today' })]);

    const writtenData = sheetMock._setValues.mock.calls[0][0] as unknown[][];
    expect(writtenData[0]).toEqual(SET_HEADERS);
  });

  it('should call getRange with full range including header', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'default_box' })]);

    expect(sheetMock.getRange).toHaveBeenCalledWith(1, 1, 2, NUM_COLS);
  });

  it('should update existing and append new in the same call', () => {
    const sheetMock = makeSheetMock([SET_HEADERS, makeSettingRow({ key: 'default_box' })]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([
      makeSetting({ key: 'default_box', value: 'today' }),
      makeSetting({ key: 'accent_color', value: 'blue' }),
    ]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it('should write all updated rows in a single setValues call', () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: 'default_box', value: 'inbox' }),
      makeSettingRow({ key: 'accent_color', value: 'green' }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([
      makeSetting({ key: 'default_box', value: 'today' }),
      makeSetting({ key: 'accent_color', value: 'blue' }),
    ]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
    const writtenData = sheetMock._setValues.mock.calls[0][0] as unknown[][];
    expect(writtenData[1][COL.value]).toBe('today');
    expect(writtenData[2][COL.value]).toBe('blue');
  });

  it('should not treat empty-key rows as existing settings', () => {
    const emptyKeyRow = SET_HEADERS.map(() => '');
    const sheetMock = makeSheetMock([SET_HEADERS, emptyKeyRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'default_box' })]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).not.toHaveBeenCalled();
  });

  it('should append a setting with empty key even when sheet has an empty-key row', () => {
    const emptyKeyRow = SET_HEADERS.map(() => '');
    const sheetMock = makeSheetMock([SET_HEADERS, emptyKeyRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: '' })]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).not.toHaveBeenCalled();
  });

  it('should append row with correct setting data', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: 'accent_color', value: 'blue', updated_at: '2025-05-01T00:00:00.000Z' })]);

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.key]).toBe('accent_color');
    expect(appendedRow[COL.value]).toBe('blue');
    expect(appendedRow[COL.updated_at]).toBe('2025-05-01T00:00:00.000Z');
  });
});

describe('initDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should insert both defaults when sheet is empty', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(2);
  });

  it('should insert default_box when it is missing', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    const appendedKeys = sheetMock.appendRow.mock.calls.map(call => (call[0] as unknown[])[COL.key]);
    expect(appendedKeys).toContain(DEFAULT_SETTINGS.DEFAULT_BOX.key);
  });

  it('should insert accent_color when it is missing', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    const appendedKeys = sheetMock.appendRow.mock.calls.map(call => (call[0] as unknown[])[COL.key]);
    expect(appendedKeys).toContain(DEFAULT_SETTINGS.ACCENT_COLOR.key);
  });

  it('should not insert default_box when it already exists', () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: DEFAULT_SETTINGS.DEFAULT_BOX.key }),
      makeSettingRow({ key: DEFAULT_SETTINGS.ACCENT_COLOR.key }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it('should only insert missing default when one already exists', () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: DEFAULT_SETTINGS.DEFAULT_BOX.key }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
    const appendedKey = (sheetMock.appendRow.mock.calls[0][0] as unknown[])[COL.key];
    expect(appendedKey).toBe(DEFAULT_SETTINGS.ACCENT_COLOR.key);
  });

  it('should insert default_box with its default value', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    // DEFAULTS inserts in order: default_box first, accent_color second
    const firstRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(firstRow[COL.key]).toBe(DEFAULT_SETTINGS.DEFAULT_BOX.key);
    expect(firstRow[COL.value]).toBe(DEFAULT_SETTINGS.DEFAULT_BOX.value);
  });

  it('should insert accent_color with its default value', () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    const secondRow = sheetMock.appendRow.mock.calls[1][0] as unknown[];
    expect(secondRow[COL.key]).toBe(DEFAULT_SETTINGS.ACCENT_COLOR.key);
    expect(secondRow[COL.value]).toBe(DEFAULT_SETTINGS.ACCENT_COLOR.value);
  });
});