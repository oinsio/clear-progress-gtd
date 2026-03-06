const SET_COLS = colMap(SHEET_NAMES.SETTINGS);

const DEFAULTS: Setting[] = [
  { key: 'default_box', value: 'inbox', updated_at: new Date().toISOString() },
  { key: 'accent_color', value: 'green', updated_at: new Date().toISOString() },
];

function settingToRow(setting: Setting): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.SETTINGS].map(col => (setting as unknown as Record<string, unknown>)[col]);
}

function getAllSettings(): Setting[] {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter((row: unknown[]) => row[0]).map((row: unknown[]) => ({
    key: String(row[SET_COLS.key]),
    value: String(row[SET_COLS.value] ?? ''),
    updated_at: String(row[SET_COLS.updated_at] ?? ''),
  }));
}

function upsertSetting(setting: Setting): void {
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

function initDefaults(): void {
  const existing = getAllSettings().map(s => s.key);
  DEFAULTS.forEach(def => {
    if (!existing.includes(def.key)) upsertSetting(def);
  });
}
