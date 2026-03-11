import { APP_NAME, API_VERSION, PROPERTY_KEYS } from '../helpers/constants';
import { jsonOk } from '../helpers/response';
import { driveFileExists } from '../helpers/drive';

export function ping(): GoogleAppsScript.Content.TextOutput {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.SPREADSHEET_ID);
  const initialized = !!spreadsheetId && driveFileExists(spreadsheetId);
  return jsonOk({ app: APP_NAME, version: API_VERSION, initialized });
}
