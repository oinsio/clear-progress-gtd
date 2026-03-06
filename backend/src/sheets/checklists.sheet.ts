function rowToItem(row: unknown[]): ChecklistItem {
  return {
    id: String(row[0] ?? ''),
    task_id: String(row[1] ?? ''),
    title: String(row[2] ?? ''),
    is_completed: row[3] === true || row[3] === 'TRUE',
    sort_order: Number(row[4] ?? 0),
    is_deleted: row[5] === true || row[5] === 'TRUE',
    created_at: String(row[6] ?? ''),
    updated_at: String(row[7] ?? ''),
    version: Number(row[8] ?? 1),
  };
}

function itemToRow(item: ChecklistItem): unknown[] {
  return [
    item.id, item.task_id, item.title, item.is_completed,
    item.sort_order, item.is_deleted, item.created_at, item.updated_at, item.version,
  ];
}

function getAllChecklistItems(): ChecklistItem[] {
  const sheet = getSheet(SHEET_NAMES.CHECKLIST_ITEMS);
  return sheet.getDataRange().getValues().slice(1).filter((row: any[]) => row[0]).map(rowToItem);
}

function getChecklistItemsByVersion(minVersion: number): ChecklistItem[] {
  return getAllChecklistItems().filter(i => i.version > minVersion);
}

function upsertChecklistItem(item: ChecklistItem): void {
  const sheet = getSheet(SHEET_NAMES.CHECKLIST_ITEMS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === item.id) {
      sheet.getRange(i + 1, 1, 1, 9).setValues([itemToRow(item)]);
      return;
    }
  }
  sheet.appendRow(itemToRow(item));
}