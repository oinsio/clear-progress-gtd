/// <reference lib="esnext" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ERROR_CODES } from '../helpers/response';
import { PROPERTY_KEYS, ERROR_MESSAGES } from '../helpers/constants';
import { resetScriptProperties, setScriptProperty } from '../../tests/setup/gas-mocks';

// client.ts has a module-level cache (_spreadsheet).
// vi.resetModules() + dynamic import is used in each beforeEach
// to ensure a fresh module state (empty cache) for every test.

describe('getSpreadsheet', () => {
  let getSpreadsheet: () => GoogleAppsScript.Spreadsheet.Spreadsheet;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    resetScriptProperties();
    const clientModule = await import('./client');
    getSpreadsheet = clientModule.getSpreadsheet;
  });

  it('should throw NOT_INITIALIZED when SPREADSHEET_ID is not set', () => {
    expect(() => getSpreadsheet()).toThrow(ERROR_CODES.NOT_INITIALIZED);
  });

  it('should call SpreadsheetApp.openById with the stored spreadsheet ID', () => {
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'my-spreadsheet-id');
    vi.mocked(SpreadsheetApp.openById).mockReturnValue({} as never);

    getSpreadsheet();

    expect(SpreadsheetApp.openById).toHaveBeenCalledWith('my-spreadsheet-id');
  });

  it('should return the spreadsheet returned by SpreadsheetApp.openById', () => {
    const mockSpreadsheet = { getSheetByName: vi.fn() };
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'my-spreadsheet-id');
    vi.mocked(SpreadsheetApp.openById).mockReturnValue(mockSpreadsheet as never);

    expect(getSpreadsheet()).toBe(mockSpreadsheet);
  });

  it('should call SpreadsheetApp.openById only once on repeated calls', () => {
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'my-spreadsheet-id');
    vi.mocked(SpreadsheetApp.openById).mockReturnValue({ getSheetByName: vi.fn() } as never);

    getSpreadsheet();
    getSpreadsheet();
    getSpreadsheet();

    expect(SpreadsheetApp.openById).toHaveBeenCalledTimes(1);
  });

  it('should return the same cached instance on repeated calls', () => {
    const mockSpreadsheet = { getSheetByName: vi.fn() };
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'my-spreadsheet-id');
    vi.mocked(SpreadsheetApp.openById).mockReturnValue(mockSpreadsheet as never);

    const firstCall = getSpreadsheet();
    const secondCall = getSpreadsheet();

    expect(firstCall).toBe(secondCall);
  });
});

describe('getSheet', () => {
  let getSheet: (name: string) => GoogleAppsScript.Spreadsheet.Sheet;
  let mockSpreadsheet: { getSheetByName: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    resetScriptProperties();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'my-spreadsheet-id');
    mockSpreadsheet = { getSheetByName: vi.fn() };
    vi.mocked(SpreadsheetApp.openById).mockReturnValue(mockSpreadsheet as never);
    const clientModule = await import('./client');
    getSheet = clientModule.getSheet;
  });

  it('should return the sheet when it exists', () => {
    const mockSheet = {};
    mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

    expect(getSheet('Tasks')).toBe(mockSheet);
  });

  it('should call getSheetByName with the given name', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue({});

    getSheet('Goals');

    expect(mockSpreadsheet.getSheetByName).toHaveBeenCalledWith('Goals');
  });

  it('should throw when sheet does not exist', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(null);

    expect(() => getSheet('NonExistent')).toThrow(
      `${ERROR_MESSAGES.SHEET_NOT_FOUND}: NonExistent`,
    );
  });

  it('should include the sheet name in the error message', () => {
    mockSpreadsheet.getSheetByName.mockReturnValue(null);

    expect(() => getSheet('MySheet')).toThrow('MySheet');
  });
});