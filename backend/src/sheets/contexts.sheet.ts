const CTX_COLS = colMap(SHEET_NAMES.CONTEXTS);

function rowToContext(row: unknown[]): Context {
  return {
    id: String(row[CTX_COLS.id] ?? ''),
    name: String(row[CTX_COLS.name] ?? ''),
    sort_order: Number(row[CTX_COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[CTX_COLS.is_deleted]),
    created_at: String(row[CTX_COLS.created_at] ?? ''),
    updated_at: String(row[CTX_COLS.updated_at] ?? ''),
    version: Number(row[CTX_COLS.version] ?? 1),
  };
}

function contextToRow(ctx: Context): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.CONTEXTS].map(col => (ctx as unknown as Record<string, unknown>)[col]);
}

function getAllContexts(): Context[] {
  const sheet = getSheet(SHEET_NAMES.CONTEXTS);
  return sheet.getDataRange().getValues().slice(1).filter((row: unknown[]) => row[0]).map(rowToContext);
}

function getContextsByVersion(minVersion: number): Context[] {
  return getAllContexts().filter(c => c.version > minVersion);
}

function upsertContext(ctx: Context): void {
  const sheet = getSheet(SHEET_NAMES.CONTEXTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ctx.id) {
      sheet.getRange(i + 1, 1, 1, SHEET_HEADERS[SHEET_NAMES.CONTEXTS].length).setValues([contextToRow(ctx)]);
      return;
    }
  }
  sheet.appendRow(contextToRow(ctx));
}
