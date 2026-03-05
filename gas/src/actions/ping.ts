import { jsonOk } from '../helpers/response';

export function ping(): GoogleAppsScript.Content.TextOutput {
  const initialized = !!PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return jsonOk({ app: 'clear_progress', version: '1.0', initialized });
}