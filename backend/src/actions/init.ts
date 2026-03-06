function init(): GoogleAppsScript.Content.TextOutput {
  const props = PropertiesService.getScriptProperties();
  const existingSpreadsheetId = props.getProperty(PROPERTY_KEYS.SPREADSHEET_ID);

  if (existingSpreadsheetId) {
    if (driveFileExists(existingSpreadsheetId)) {
      return jsonOk({ created: false, spreadsheet_id: existingSpreadsheetId });
    }
    props.deleteAllProperties();
  }

  // Create folder structure
  const rootFolderFile = Drive.Files.create({ name: DRIVE_FOLDER_NAMES.ROOT, mimeType: DRIVE_MIME_TYPES.FOLDER });
  const rootFolderId = rootFolderFile.id!;

  const coversFolderFile = Drive.Files.create({
    name: DRIVE_FOLDER_NAMES.COVERS,
    mimeType: DRIVE_MIME_TYPES.FOLDER,
    parents: [rootFolderId],
  });
  const coversFolderId = coversFolderFile.id!;

  // Create spreadsheet
  const spreadsheetFile = Drive.Files.create({
    name: DRIVE_FOLDER_NAMES.DATA_FILE,
    mimeType: DRIVE_MIME_TYPES.SPREADSHEET,
    parents: [rootFolderId],
  });
  const spreadsheet = SpreadsheetApp.openById(spreadsheetFile.id!);

  // Create sheets with headers
  const defaultSheet = spreadsheet.getSheets()[0];
  const sheetNames = Object.keys(SHEET_HEADERS);

  sheetNames.forEach((name, index) => {
    let sheet: GoogleAppsScript.Spreadsheet.Sheet;
    if (index === 0) {
      sheet = defaultSheet;
      sheet.setName(name);
    } else {
      sheet = spreadsheet.insertSheet(name);
    }
    sheet.getRange(1, 1, 1, SHEET_HEADERS[name].length).setValues([SHEET_HEADERS[name]]);
  });

  // Save IDs
  props.setProperties({
    [PROPERTY_KEYS.SPREADSHEET_ID]: spreadsheet.getId(),
    [PROPERTY_KEYS.FOLDER_ID]: rootFolderId,
    [PROPERTY_KEYS.COVERS_FOLDER_ID]: coversFolderId,
  });

  // Write default settings
  initDefaults();

  return jsonOk({ created: true, spreadsheet_id: spreadsheet.getId(), folder_id: rootFolderId });
}