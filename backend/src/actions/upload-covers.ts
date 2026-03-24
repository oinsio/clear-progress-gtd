import {
  MAX_COVER_BATCH_SIZE,
  PROPERTY_KEYS,
  DRIVE_QUERY_FIELDS,
  ERROR_MESSAGES,
  buildFolderQuery,
} from '../helpers/constants';
import { jsonOk, jsonError, jsonNotInitialized, ERROR_CODES } from '../helpers/response';
import { uploadSingleCover } from './upload-cover';
import type { SingleCoverInput, SingleCoverResult } from './upload-cover';

interface BatchCoverInput extends SingleCoverInput {
  local_id: string;
}

interface BatchCoverResult extends Omit<SingleCoverResult, 'errorMessage'> {
  local_id: string;
}

export function uploadCovers(payload: {
  covers: BatchCoverInput[];
}): GoogleAppsScript.Content.TextOutput {
  const { covers } = payload;

  if (!Array.isArray(covers) || covers.length === 0) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.COVERS_REQUIRED);
  }

  if (covers.length > MAX_COVER_BATCH_SIZE) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.COVERS_TOO_MANY);
  }

  const coversFolderId = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.COVERS_FOLDER_ID);
  if (!coversFolderId) {
    return jsonNotInitialized();
  }

  const fileList = Drive.Files.list({
    q: buildFolderQuery(coversFolderId),
    fields: DRIVE_QUERY_FIELDS.COVER_FILES,
  });
  const existingFiles = fileList.files ?? [];

  const results: BatchCoverResult[] = covers.map(cover => {
    const result = uploadSingleCover(cover, existingFiles, coversFolderId);
    const { errorMessage: _, ...resultWithoutMessage } = result;
    return { ...resultWithoutMessage, local_id: cover.local_id };
  });

  return jsonOk({ results });
}
