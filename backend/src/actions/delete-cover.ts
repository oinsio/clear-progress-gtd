function deleteCover(payload: { file_id: string }): GoogleAppsScript.Content.TextOutput {
  const { file_id } = payload;

  if (!file_id) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.FILE_ID_REQUIRED);
  }

  const allFileIds = getCoverFileIds();
  const refCount = allFileIds.filter(id => id === file_id).length;

  if (refCount > 0) {
    return jsonOk({ deleted: false, ref_count: refCount });
  }

  try {
    Drive.Files.update({ trashed: true }, file_id);
    return jsonOk({ deleted: true, ref_count: 0 });
  } catch {
    return jsonError(ERROR_CODES.FILE_NOT_FOUND, `${ERROR_MESSAGES.FILE_NOT_FOUND}: ${file_id}`);
  }
}
