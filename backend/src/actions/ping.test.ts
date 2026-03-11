import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ping } from './ping';
import { APP_NAME, API_VERSION, PROPERTY_KEYS } from '../helpers/constants';
import { resetScriptProperties, setScriptProperty } from '../../tests/setup/gas-mocks';

vi.mock('../helpers/drive', () => ({ driveFileExists: vi.fn() }));

import { driveFileExists } from '../helpers/drive';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

describe('ping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
  });

  it('should return ok: true', () => {
    vi.mocked(driveFileExists).mockReturnValue(false);
    ping();
    expect(parseResponse().ok).toBe(true);
  });

  it('should return app name', () => {
    vi.mocked(driveFileExists).mockReturnValue(false);
    ping();
    expect(parseResponse().app).toBe(APP_NAME);
  });

  it('should return api version', () => {
    vi.mocked(driveFileExists).mockReturnValue(false);
    ping();
    expect(parseResponse().version).toBe(API_VERSION);
  });

  it('should return initialized: false when spreadsheet_id property is not set', () => {
    vi.mocked(driveFileExists).mockReturnValue(false);
    ping();
    expect(parseResponse().initialized).toBe(false);
  });

  it('should return initialized: false when spreadsheet_id is set but file does not exist', () => {
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'some-spreadsheet-id');
    vi.mocked(driveFileExists).mockReturnValue(false);
    ping();
    expect(parseResponse().initialized).toBe(false);
  });

  it('should return initialized: true when spreadsheet_id is set and file exists', () => {
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, 'some-spreadsheet-id');
    vi.mocked(driveFileExists).mockReturnValue(true);
    ping();
    expect(parseResponse().initialized).toBe(true);
  });

  it('should call driveFileExists with the stored spreadsheet_id', () => {
    const spreadsheetId = 'my-spreadsheet-id';
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, spreadsheetId);
    vi.mocked(driveFileExists).mockReturnValue(true);
    ping();
    expect(driveFileExists).toHaveBeenCalledWith(spreadsheetId);
  });

  it('should not call driveFileExists when spreadsheet_id is not set', () => {
    ping();
    expect(driveFileExists).not.toHaveBeenCalled();
  });
});