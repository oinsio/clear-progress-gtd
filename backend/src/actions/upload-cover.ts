const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

function uploadCover(payload: {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
}): GoogleAppsScript.Content.TextOutput {
  const { filename, mime_type, data } = payload;

  const decoded = Utilities.base64Decode(data);
  if (decoded.length > MAX_SIZE_BYTES) {
    return jsonError(ERROR_CODES.FILE_TOO_LARGE, 'Cover image must be 2 MB or less');
  }

  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, decoded)
    .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
    .join('');

  const coversFolderId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.COVERS_FOLDER_ID);
  if (!coversFolderId) {
    return jsonNotInitialized();
  }

  // Check for deduplication
  const fileList = Drive.Files.list({
    q: `'${coversFolderId}' in parents and trashed = false`,
    fields: DRIVE_QUERY_FIELDS.COVER_FILES,
  });
  for (const f of (fileList.files ?? [])) {
    if (f.description === hash) {
      return jsonOk({
        file_id: f.id,
        thumbnail_url: thumbnailUrl(f.id!),
        reused: true,
      });
    }
  }

  // Create new file
  const ext = filename.split('.').pop() ?? 'jpg';
  const newFilename = `${hash.substring(0, COVER_HASH_PREFIX_LENGTH)}.${ext}`;
  const blob = Utilities.newBlob(decoded, mime_type, newFilename);
  const newFile = Drive.Files.create(
    { name: newFilename, description: hash, parents: [coversFolderId] },
    blob,
  );
  Drive.Permissions.create({ role: DRIVE_PERMISSIONS.ROLE_READER, type: DRIVE_PERMISSIONS.TYPE_ANYONE }, newFile.id!);

  return jsonOk({
    file_id: newFile.id,
    thumbnail_url: thumbnailUrl(newFile.id!),
    reused: false,
  });
}