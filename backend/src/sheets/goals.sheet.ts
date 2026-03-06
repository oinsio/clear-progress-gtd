const GOAL_COLS = colMap(SHEET_NAMES.GOALS);

function rowToGoal(row: unknown[]): Goal {
  return {
    id: String(row[GOAL_COLS.id] ?? ''),
    title: String(row[GOAL_COLS.title] ?? ''),
    description: String(row[GOAL_COLS.description] ?? ''),
    cover_file_id: String(row[GOAL_COLS.cover_file_id] ?? ''),
    status: String(row[GOAL_COLS.status] ?? 'not_started') as Goal['status'],
    sort_order: Number(row[GOAL_COLS.sort_order] ?? 0),
    is_deleted: row[GOAL_COLS.is_deleted] === true || row[GOAL_COLS.is_deleted] === 'TRUE',
    created_at: String(row[GOAL_COLS.created_at] ?? ''),
    updated_at: String(row[GOAL_COLS.updated_at] ?? ''),
    version: Number(row[GOAL_COLS.version] ?? 1),
  };
}

function goalToRow(goal: Goal): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.GOALS].map(col => (goal as unknown as Record<string, unknown>)[col]);
}

function getAllGoals(): Goal[] {
  const sheet = getSheet(SHEET_NAMES.GOALS);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter((row: unknown[]) => row[0]).map(rowToGoal);
}

function getGoalsByVersion(minVersion: number): Goal[] {
  return getAllGoals().filter(g => g.version > minVersion);
}

function upsertGoal(goal: Goal): void {
  const sheet = getSheet(SHEET_NAMES.GOALS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === goal.id) {
      sheet.getRange(i + 1, 1, 1, SHEET_HEADERS[SHEET_NAMES.GOALS].length).setValues([goalToRow(goal)]);
      return;
    }
  }

  sheet.appendRow(goalToRow(goal));
}

function getCoverFileIds(): string[] {
  return getAllGoals().map(g => g.cover_file_id).filter(Boolean);
}
