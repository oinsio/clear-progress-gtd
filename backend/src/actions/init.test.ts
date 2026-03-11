import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from './init';
import { PROPERTY_KEYS, DRIVE_FOLDER_NAMES, DRIVE_MIME_TYPES, SHEET_HEADERS } from '../helpers/constants';
import { resetScriptProperties, setScriptProperty, getScriptPropertiesStore } from '../../tests/setup/gas-mocks';

vi.mock('../helpers/drive', () => ({ driveFileExists: vi.fn() }));
vi.mock('../sheets/settings.sheet', () => ({ initDefaults: vi.fn() }));

import { driveFileExists } from '../helpers/drive';
import { initDefaults } from '../sheets/settings.sheet';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

function makeSheetMock() {
  return {
    setName: vi.fn(),
    getRange: vi.fn().mockReturnValue({ setValues: vi.fn() }),
  };
}

const MOCK_ROOT_FOLDER_ID = 'root-folder-id';
const MOCK_COVERS_FOLDER_ID = 'covers-folder-id';
const MOCK_SPREADSHEET_FILE_ID = 'spreadsheet-file-id';
const MOCK_SPREADSHEET_ID = 'mock-spreadsheet-id';

describe('init — already initialized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, MOCK_SPREADSHEET_ID);
    vi.mocked(driveFileExists).mockReturnValue(true);
  });

  it('should return ok: true, created: false, spreadsheet_id when already initialized', () => {
    init();
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.created).toBe(false);
    expect(response.spreadsheet_id).toBe(MOCK_SPREADSHEET_ID);
  });

  it('should not call Drive.Files.create when already initialized', () => {
    init();
    expect(Drive.Files.create).not.toHaveBeenCalled();
  });
});

describe('init — stale property (file deleted)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'stale-spreadsheet-id');
    vi.mocked(driveFileExists).mockReturnValue(false);

    const defaultSheet = makeSheetMock();
    const sheetNames = Object.keys(SHEET_HEADERS);
    const insertedSheets = sheetNames.slice(1).map(() => makeSheetMock());
    let insertedSheetIndex = 0;

    const spreadsheetMock = {
      getSheets: vi.fn().mockReturnValue([defaultSheet]),
      insertSheet: vi.fn().mockImplementation(() => insertedSheets[insertedSheetIndex++]),
      getId: vi.fn().mockReturnValue(MOCK_SPREADSHEET_ID),
    };

    vi.mocked(Drive.Files.create)
      .mockReturnValueOnce({ id: MOCK_ROOT_FOLDER_ID })
      .mockReturnValueOnce({ id: MOCK_COVERS_FOLDER_ID })
      .mockReturnValueOnce({ id: MOCK_SPREADSHEET_FILE_ID });

    vi.mocked(SpreadsheetApp.openById).mockReturnValue(spreadsheetMock as never);
    vi.mocked(initDefaults).mockReturnValue(undefined);
  });

  it('should clear stale properties and save new spreadsheet_id', () => {
    init();
    const store = getScriptPropertiesStore();
    expect(store[PROPERTY_KEYS.SPREADSHEET_ID]).toBe(MOCK_SPREADSHEET_ID);
  });

  it('should call Drive.Files.create 3 times when stale property found', () => {
    init();
    expect(Drive.Files.create).toHaveBeenCalledTimes(3);
  });
});

describe('init — first time setup', () => {
  let defaultSheet: ReturnType<typeof makeSheetMock>;
  let insertedSheets: ReturnType<typeof makeSheetMock>[];
  let spreadsheetMock: {
    getSheets: ReturnType<typeof vi.fn>;
    insertSheet: ReturnType<typeof vi.fn>;
    getId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();

    defaultSheet = makeSheetMock();
    const sheetNames = Object.keys(SHEET_HEADERS);
    insertedSheets = sheetNames.slice(1).map(() => makeSheetMock());
    let insertedSheetIndex = 0;

    spreadsheetMock = {
      getSheets: vi.fn().mockReturnValue([defaultSheet]),
      insertSheet: vi.fn().mockImplementation(() => insertedSheets[insertedSheetIndex++]),
      getId: vi.fn().mockReturnValue(MOCK_SPREADSHEET_ID),
    };

    vi.mocked(Drive.Files.create)
      .mockReturnValueOnce({ id: MOCK_ROOT_FOLDER_ID })
      .mockReturnValueOnce({ id: MOCK_COVERS_FOLDER_ID })
      .mockReturnValueOnce({ id: MOCK_SPREADSHEET_FILE_ID });

    vi.mocked(SpreadsheetApp.openById).mockReturnValue(spreadsheetMock as never);
    vi.mocked(initDefaults).mockReturnValue(undefined);
  });

  it('should create root folder with correct name and mimeType', () => {
    init();
    expect(vi.mocked(Drive.Files.create).mock.calls[0][0]).toMatchObject({
      name: DRIVE_FOLDER_NAMES.ROOT,
      mimeType: DRIVE_MIME_TYPES.FOLDER,
    });
  });

  it('should create covers folder inside root folder', () => {
    init();
    expect(vi.mocked(Drive.Files.create).mock.calls[1][0]).toMatchObject({
      name: DRIVE_FOLDER_NAMES.COVERS,
      mimeType: DRIVE_MIME_TYPES.FOLDER,
      parents: [MOCK_ROOT_FOLDER_ID],
    });
  });

  it('should create spreadsheet file inside root folder', () => {
    init();
    expect(vi.mocked(Drive.Files.create).mock.calls[2][0]).toMatchObject({
      name: DRIVE_FOLDER_NAMES.DATA_FILE,
      mimeType: DRIVE_MIME_TYPES.SPREADSHEET,
      parents: [MOCK_ROOT_FOLDER_ID],
    });
  });

  it('should open spreadsheet by id returned from Drive', () => {
    init();
    expect(SpreadsheetApp.openById).toHaveBeenCalledWith(MOCK_SPREADSHEET_FILE_ID);
  });

  it('should rename default sheet to the first sheet name', () => {
    init();
    const firstSheetName = Object.keys(SHEET_HEADERS)[0];
    expect(defaultSheet.setName).toHaveBeenCalledWith(firstSheetName);
  });

  it('should insert N-1 additional sheets with correct names', () => {
    init();
    const sheetNames = Object.keys(SHEET_HEADERS);
    sheetNames.slice(1).forEach((sheetName) => {
      expect(spreadsheetMock.insertSheet).toHaveBeenCalledWith(sheetName);
    });
    expect(spreadsheetMock.insertSheet).toHaveBeenCalledTimes(sheetNames.length - 1);
  });

  it('should set headers on the first (renamed) sheet', () => {
    init();
    const firstSheetName = Object.keys(SHEET_HEADERS)[0];
    const headers = SHEET_HEADERS[firstSheetName];
    expect(defaultSheet.getRange).toHaveBeenCalledWith(1, 1, 1, headers.length);
    const rangeInstance = defaultSheet.getRange.mock.results[0].value;
    expect(rangeInstance.setValues).toHaveBeenCalledWith([headers]);
  });

  it('should set headers on each inserted sheet', () => {
    init();
    const sheetNames = Object.keys(SHEET_HEADERS);
    insertedSheets.forEach((sheetMock, index) => {
      const sheetName = sheetNames[index + 1];
      const headers = SHEET_HEADERS[sheetName];
      expect(sheetMock.getRange).toHaveBeenCalledWith(1, 1, 1, headers.length);
      const rangeInstance = sheetMock.getRange.mock.results[0].value;
      expect(rangeInstance.setValues).toHaveBeenCalledWith([headers]);
    });
  });

  it('should save SPREADSHEET_ID, FOLDER_ID, COVERS_FOLDER_ID to PropertiesService', () => {
    init();
    const store = getScriptPropertiesStore();
    expect(store[PROPERTY_KEYS.SPREADSHEET_ID]).toBe(MOCK_SPREADSHEET_ID);
    expect(store[PROPERTY_KEYS.FOLDER_ID]).toBe(MOCK_ROOT_FOLDER_ID);
    expect(store[PROPERTY_KEYS.COVERS_FOLDER_ID]).toBe(MOCK_COVERS_FOLDER_ID);
  });

  it('should call initDefaults once', () => {
    init();
    expect(initDefaults).toHaveBeenCalledTimes(1);
  });

  it('should return created: true with spreadsheet_id and folder_id', () => {
    init();
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.created).toBe(true);
    expect(response.spreadsheet_id).toBe(MOCK_SPREADSHEET_ID);
    expect(response.folder_id).toBe(MOCK_ROOT_FOLDER_ID);
  });
});
