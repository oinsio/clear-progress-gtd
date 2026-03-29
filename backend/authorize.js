/**
 * Run this function manually in the Apps Script editor to authorize all required OAuth scopes.
 *
 * When to use:
 * - After adding a new scope to appsscript.json
 * - When getting "You do not have permission to call UrlFetchApp.fetch" errors
 *
 * Steps:
 * 1. Open https://script.google.com → open this project
 * 2. Select "authorizeScopes" in the function dropdown
 * 3. Click Run → accept the authorization dialog
 * 4. Check Execution Log: "Done. All scopes authorized."
 */
function authorizeScopes() {
  UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=probe', { muteHttpExceptions: true });
  SpreadsheetApp.getActiveSpreadsheet();
  DriveApp.getRootFolder();
  Logger.log('Done. All scopes authorized.');
}
