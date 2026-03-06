const DEFAULTS: Setting[] = [
  { key: 'default_box', value: 'inbox', updated_at: new Date().toISOString() },
  { key: 'accent_color', value: 'green', updated_at: new Date().toISOString() },
];

function getAllSettings(): Setting[] {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter((row: any[]) => row[0]).map((row: any[]) => ({
    key: String(row[0]),
    value: String(row[1] ?? ''),
    updated_at: String(row[2] ?? ''),
  }));
}

function upsertSetting(setting: Setting): void {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === setting.key) {
      sheet.getRange(i + 1, 1, 1, 3).setValues([[setting.key, setting.value, setting.updated_at]]);
      return;
    }
  }
  sheet.appendRow([setting.key, setting.value, setting.updated_at]);
}

function initDefaults(): void {
  const existing = getAllSettings().map(s => s.key);
  DEFAULTS.forEach(def => {
    if (!existing.includes(def.key)) upsertSetting(def);
  });
}
