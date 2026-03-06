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
    return jsonError('FILE_TOO_LARGE', 'Cover image must be 2 MB or less');
  }

  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, decoded)
    .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))
    .join('');

  const coversFolderId = PropertiesService.getScriptProperties().getProperty('COVERS_FOLDER_ID');
  if (!coversFolderId) {
    return jsonError('NOT_INITIALIZED', 'Call init before using the API');
  }

  const coversFolder = DriveApp.getFolderById(coversFolderId);

  // Check for deduplication
  const files = coversFolder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getDescription() === hash) {
      return jsonOk({
        file_id: file.getId(),
        thumbnail_url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w400`,
        reused: true,
      });
    }
  }

  // Create new file
  const ext = filename.split('.').pop() ?? 'jpg';
  const newFilename = `${hash.substring(0, 12)}.${ext}`;
  const blob = Utilities.newBlob(decoded, mime_type, newFilename);
  const file = coversFolder.createFile(blob);
  file.setDescription(hash);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonOk({
    file_id: file.getId(),
    thumbnail_url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w400`,
    reused: false,
  });
}