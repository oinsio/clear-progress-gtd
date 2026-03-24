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

export interface SingleCoverInput {
  local_id?: string;
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
}

export interface SingleCoverResult {
  local_id?: string;
  goal_id: string;
  file_id?: string;
  reused?: boolean;
  error?: string;
  errorMessage?: string;
}

interface DriveFileEntry {
  id?: string;
  description?: string;
}

export function uploadSingleCover(
  input: SingleCoverInput,
  existingFiles: DriveFileEntry[],
  coversFolderId: string,
): SingleCoverResult {
  const { filename, mime_type, data, goal_id, local_id } = input;

  if (!mime_type.startsWith('image/')) {
    return { goal_id, local_id, error: ERROR_CODES.INVALID_PAYLOAD, errorMessage: ERROR_MESSAGES.COVER_INVALID_MIME };
  }

  if (!data) {
    return { goal_id, local_id, error: ERROR_CODES.INVALID_PAYLOAD, errorMessage: ERROR_MESSAGES.DATA_REQUIRED };
  }

  const decoded = Utilities.base64Decode(data);
  if (decoded.length > MAX_COVER_SIZE_BYTES) {
    return { goal_id, local_id, error: ERROR_CODES.FILE_TOO_LARGE, errorMessage: ERROR_MESSAGES.COVER_TOO_LARGE };
  }

  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, decoded)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');

  for (const file of existingFiles) {
    if (file.description === hash) {
      return { goal_id, local_id, file_id: file.id, reused: true };
    }
  }

  const ext = filename.split('.').pop() ?? DEFAULT_COVER_EXTENSION;
  const newFilename = `${hash.substring(0, COVER_HASH_PREFIX_LENGTH)}.${ext}`;
  const blob = Utilities.newBlob(decoded, mime_type, newFilename);
  const newFile = Drive.Files.create(
    { name: newFilename, description: hash, parents: [coversFolderId] },
    blob,
  );
  Drive.Permissions.create({ role: DRIVE_PERMISSIONS.ROLE_READER, type: DRIVE_PERMISSIONS.TYPE_ANYONE }, newFile.id!);

  return { goal_id, local_id, file_id: newFile.id, reused: false };
}

export function uploadCover(payload: {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
}): GoogleAppsScript.Content.TextOutput {
  const coversFolderId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.COVERS_FOLDER_ID);
  if (!coversFolderId) {
    return jsonNotInitialized();
  }

  const fileList = Drive.Files.list({
    q: buildFolderQuery(coversFolderId),
    fields: DRIVE_QUERY_FIELDS.COVER_FILES,
  });
  const existingFiles = fileList.files ?? [];

  const result = uploadSingleCover(payload, existingFiles, coversFolderId);

  if (result.error) {
    return jsonError(result.error, result.errorMessage!);
  }
  return jsonOk({ file_id: result.file_id, reused: result.reused });
}
