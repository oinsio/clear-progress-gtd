import {
  MAX_COVER_SIZE_BYTES,
  COVER_HASH_PREFIX_LENGTH,
  DEFAULT_COVER_EXTENSION,
  PROPERTY_KEYS,
  DRIVE_QUERY_FIELDS,
  DRIVE_PERMISSIONS,
  ERROR_MESSAGES,
  buildFolderQuery,
} from '../helpers/constants';
import { jsonOk, jsonError, jsonNotInitialized, ERROR_CODES } from '../helpers/response';

export function uploadCover(payload: {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
}): GoogleAppsScript.Content.TextOutput {
  const { filename, mime_type, data } = payload;

  if (!mime_type.startsWith('image/')) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.COVER_INVALID_MIME);
  }

  if (!data) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.DATA_REQUIRED);
  }

  const decoded = Utilities.base64Decode(data);
  if (decoded.length > MAX_COVER_SIZE_BYTES) {
    return jsonError(ERROR_CODES.FILE_TOO_LARGE, ERROR_MESSAGES.COVER_TOO_LARGE);
  }

  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, decoded)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');

  const coversFolderId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.COVERS_FOLDER_ID);
  if (!coversFolderId) {
    return jsonNotInitialized();
  }

  // Check for deduplication
  const fileList = Drive.Files.list({
    q: buildFolderQuery(coversFolderId),
    fields: DRIVE_QUERY_FIELDS.COVER_FILES,
  });
  for (const file of (fileList.files ?? [])) {
    if (file.description === hash) {
      return jsonOk({
        file_id: file.id,
        reused: true,
      });
    }
  }

  // Create new file
  const ext = filename.split('.').pop() ?? DEFAULT_COVER_EXTENSION;
  const newFilename = `${hash.substring(0, COVER_HASH_PREFIX_LENGTH)}.${ext}`;
  const blob = Utilities.newBlob(decoded, mime_type, newFilename);
  const newFile = Drive.Files.create(
    { name: newFilename, description: hash, parents: [coversFolderId] },
    blob,
  );
  Drive.Permissions.create({ role: DRIVE_PERMISSIONS.ROLE_READER, type: DRIVE_PERMISSIONS.TYPE_ANYONE }, newFile.id!);

  return jsonOk({
    file_id: newFile.id,
    reused: false,
  });
}
