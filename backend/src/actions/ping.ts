function ping(): GoogleAppsScript.Content.TextOutput {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const initialized = !!spreadsheetId && driveFileExists(spreadsheetId);
  return jsonOk({ app: 'clear_progress', version: '1.0', initialized });
}