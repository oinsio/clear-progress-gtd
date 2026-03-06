/**
 * Checks whether a Drive file exists and is not trashed.
 * Works within the `drive.file` scope (files created by this script).
 * Returns false if the file is trashed or permanently deleted.
 */
function driveFileExists(fileId: string): boolean {
  try {
    const file = Drive.Files.get(fileId, { fields: 'id,trashed' });
    return !file.trashed;
  } catch {
    return false;
  }
}
