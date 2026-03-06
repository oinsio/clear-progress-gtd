function deleteCover(payload: { file_id: string }): GoogleAppsScript.Content.TextOutput {
  const { file_id } = payload;

  if (!file_id) {
    return jsonError('INVALID_PAYLOAD', 'file_id is required');
  }

  const allFileIds = getCoverFileIds();
  const refCount = allFileIds.filter(id => id === file_id).length;

  if (refCount > 0) {
    return jsonOk({ deleted: false, ref_count: refCount });
  }

  try {
    DriveApp.getFileById(file_id).setTrashed(true);
    return jsonOk({ deleted: true, ref_count: 0 });
  } catch {
    return jsonError('FILE_NOT_FOUND', `File not found: ${file_id}`);
  }
}