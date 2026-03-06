const CAT_COLS = colMap(SHEET_NAMES.CATEGORIES);

function rowToCategory(row: unknown[]): Category {
  return {
    id: String(row[CAT_COLS.id] ?? ''),
    name: String(row[CAT_COLS.name] ?? ''),
    sort_order: Number(row[CAT_COLS.sort_order] ?? 0),
    is_deleted: row[CAT_COLS.is_deleted] === true || row[CAT_COLS.is_deleted] === 'TRUE',
    created_at: String(row[CAT_COLS.created_at] ?? ''),
    updated_at: String(row[CAT_COLS.updated_at] ?? ''),
    version: Number(row[CAT_COLS.version] ?? 1),
  };
}

function categoryToRow(category: Category): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.CATEGORIES].map(col => (category as unknown as Record<string, unknown>)[col]);
}

function getAllCategories(): Category[] {
  const sheet = getSheet(SHEET_NAMES.CATEGORIES);
  return sheet.getDataRange().getValues().slice(1).filter((row: unknown[]) => row[0]).map(rowToCategory);
}

function getCategoriesByVersion(minVersion: number): Category[] {
  return getAllCategories().filter(c => c.version > minVersion);
}

function upsertCategory(category: Category): void {
  const sheet = getSheet(SHEET_NAMES.CATEGORIES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === category.id) {
      sheet.getRange(i + 1, 1, 1, SHEET_HEADERS[SHEET_NAMES.CATEGORIES].length).setValues([categoryToRow(category)]);
      return;
    }
  }
  sheet.appendRow(categoryToRow(category));
}
