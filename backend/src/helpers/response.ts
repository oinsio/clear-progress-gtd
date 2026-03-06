function jsonOk(data: object): GoogleAppsScript.Content.TextOutput {
  const payload = JSON.stringify({ ok: true, ...data });
  return ContentService.createTextOutput(payload).setMimeType(
    ContentService.MimeType.JSON
  );
}

function jsonError(
  error: string,
  message: string
): GoogleAppsScript.Content.TextOutput {
  const payload = JSON.stringify({ ok: false, error, message });
  return ContentService.createTextOutput(payload).setMimeType(
    ContentService.MimeType.JSON
  );
}