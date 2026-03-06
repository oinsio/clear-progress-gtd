function rowToCategory(row: unknown[]): Category {
  return {
    id: String(row[0] ?? ''),
    name: String(row[1] ?? ''),
    sort_order: Number(row[2] ?? 0),
    is_deleted: row[3] === true || row[3] === 'TRUE',
    created_at: String(row[4] ?? ''),
    updated_at: String(row[5] ?? ''),
    version: Number(row[6] ?? 1),
  };
}

function categoryToRow(category: Category): unknown[] {
  return [category.id, category.name, category.sort_order, category.is_deleted, category.created_at, category.updated_at, category.version];
}

function getAllCategories(): Category[] {
  const sheet = getSheet(SHEET_NAMES.CATEGORIES);
  return sheet.getDataRange().getValues().slice(1).filter((row: any[]) => row[0]).map(rowToCategory);
}

function getCategoriesByVersion(minVersion: number): Category[] {
  return getAllCategories().filter(c => c.version > minVersion);
}

function upsertCategory(category: Category): void {
  const sheet = getSheet(SHEET_NAMES.CATEGORIES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === category.id) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([categoryToRow(category)]);
      return;
    }
  }
  sheet.appendRow(categoryToRow(category));
}