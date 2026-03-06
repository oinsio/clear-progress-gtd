function rowToContext(row: unknown[]): Context {
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

function contextToRow(ctx: Context): unknown[] {
  return [ctx.id, ctx.name, ctx.sort_order, ctx.is_deleted, ctx.created_at, ctx.updated_at, ctx.version];
}

function getAllContexts(): Context[] {
  const sheet = getSheet(SHEET_NAMES.CONTEXTS);
  return sheet.getDataRange().getValues().slice(1).filter((row: any[]) => row[0]).map(rowToContext);
}

function getContextsByVersion(minVersion: number): Context[] {
  return getAllContexts().filter(c => c.version > minVersion);
}

function upsertContext(ctx: Context): void {
  const sheet = getSheet(SHEET_NAMES.CONTEXTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ctx.id) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([contextToRow(ctx)]);
      return;
    }
  }
  sheet.appendRow(contextToRow(ctx));
}