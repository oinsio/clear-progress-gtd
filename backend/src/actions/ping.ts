function ping(): GoogleAppsScript.Content.TextOutput {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.SPREADSHEET_ID);
  const initialized = !!spreadsheetId && driveFileExists(spreadsheetId);
  return jsonOk({ app: APP_NAME, version: API_VERSION, initialized });
}