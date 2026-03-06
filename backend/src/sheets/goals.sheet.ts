function rowToGoal(row: unknown[]): Goal {
  return {
    id: String(row[0] ?? ''),
    title: String(row[1] ?? ''),
    description: String(row[2] ?? ''),
    cover_file_id: String(row[3] ?? ''),
    status: String(row[4] ?? 'not_started') as Goal['status'],
    sort_order: Number(row[5] ?? 0),
    is_deleted: row[6] === true || row[6] === 'TRUE',
    created_at: String(row[7] ?? ''),
    updated_at: String(row[8] ?? ''),
    version: Number(row[9] ?? 1),
  };
}

function goalToRow(goal: Goal): unknown[] {
  return [
    goal.id, goal.title, goal.description, goal.cover_file_id,
    goal.status, goal.sort_order, goal.is_deleted,
    goal.created_at, goal.updated_at, goal.version,
  ];
}

function getAllGoals(): Goal[] {
  const sheet = getSheet(SHEET_NAMES.GOALS);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter((row: any[]) => row[0]).map(rowToGoal);
}

function getGoalsByVersion(minVersion: number): Goal[] {
  return getAllGoals().filter(g => g.version > minVersion);
}

function upsertGoal(goal: Goal): void {
  const sheet = getSheet(SHEET_NAMES.GOALS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === goal.id) {
      sheet.getRange(i + 1, 1, 1, 10).setValues([goalToRow(goal)]);
      return;
    }
  }

  sheet.appendRow(goalToRow(goal));
}

function getCoverFileIds(): string[] {
  return getAllGoals().map(g => g.cover_file_id).filter(Boolean);
}