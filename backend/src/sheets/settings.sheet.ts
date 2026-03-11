import { SHEET_NAMES, SHEET_HEADERS, colMap, DEFAULT_SETTINGS } from '../helpers/constants';
import { getSheet } from './client';
import type { Setting } from '../types';

const SET_COLS = colMap(SHEET_NAMES.SETTINGS);

const DEFAULTS: Setting[] = [
  { ...DEFAULT_SETTINGS.DEFAULT_BOX, updated_at: new Date().toISOString() },
  { ...DEFAULT_SETTINGS.ACCENT_COLOR, updated_at: new Date().toISOString() },
];

function settingToRow(setting: Setting): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.SETTINGS].map(col => (setting as unknown as Record<string, unknown>)[col]);
}

export function getAllSettings(): Setting[] {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter((row: unknown[]) => row[0]).map((row: unknown[]) => ({
    key: String(row[SET_COLS.key]),
    value: String(row[SET_COLS.value] ?? ''),
    updated_at: String(row[SET_COLS.updated_at] ?? ''),
  }));
}

export function upsertSetting(setting: Setting): void {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][SET_COLS.key] === setting.key) {
      sheet.getRange(i + 1, 1, 1, SHEET_HEADERS[SHEET_NAMES.SETTINGS].length).setValues([settingToRow(setting)]);
      return;
    }
  }
  sheet.appendRow(settingToRow(setting));
}

export function initDefaults(): void {
  const existingKeys = getAllSettings().map(s => s.key);
  DEFAULTS.forEach(def => {
    if (!existingKeys.includes(def.key)) upsertSetting(def);
  });
}
