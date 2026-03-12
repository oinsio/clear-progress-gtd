import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadCover } from './upload-cover';
import { ERROR_CODES } from '../helpers/response';
import {
  MAX_COVER_SIZE_BYTES,
  COVER_HASH_PREFIX_LENGTH,
  PROPERTY_KEYS,
  thumbnailUrl,
} from '../helpers/constants';
import { resetScriptProperties, setScriptProperty } from '../../tests/setup/gas-mocks';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

// When computeDigest returns Array(32).fill(0), each byte maps to '00'
const MOCK_HASH = '00'.repeat(32);
const MOCK_HASH_PREFIX = '0'.repeat(COVER_HASH_PREFIX_LENGTH);
const COVERS_FOLDER_ID = 'covers-folder-id';

const validPayload = {
  goal_id: 'goal-1',
  filename: 'cover.jpg',
  mime_type: 'image/jpeg',
  data: 'base64encodeddata',
};

describe('uploadCover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
    setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, COVERS_FOLDER_ID);
    vi.mocked(Utilities.base64Decode).mockReturnValue([]);
    vi.mocked(Utilities.computeDigest).mockReturnValue(Array(32).fill(0));
    vi.mocked(Utilities.newBlob).mockReturnValue({} as never);
    vi.mocked(Drive.Files.list).mockReturnValue({ files: [] });
    vi.mocked(Drive.Files.create).mockReturnValue({ id: 'new-file-id' });
  });

  describe('missing data field', () => {
    it('should return ok: false when data field is missing', () => {
      const payloadWithoutData = { goal_id: 'goal-1', filename: 'cover.jpg', mime_type: 'image/jpeg' };

      uploadCover(payloadWithoutData as Parameters<typeof uploadCover>[0]);

      expect(parseResponse().ok).toBe(false);
    });

    it('should return INVALID_PAYLOAD error code when data field is missing', () => {
      const payloadWithoutData = { goal_id: 'goal-1', filename: 'cover.jpg', mime_type: 'image/jpeg' };

      uploadCover(payloadWithoutData as Parameters<typeof uploadCover>[0]);

      expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should not call base64Decode when data field is missing', () => {
      const payloadWithoutData = { goal_id: 'goal-1', filename: 'cover.jpg', mime_type: 'image/jpeg' };

      uploadCover(payloadWithoutData as Parameters<typeof uploadCover>[0]);

      expect(Utilities.base64Decode).not.toHaveBeenCalled();
    });
  });

  describe('size validation', () => {
    it('should return FILE_TOO_LARGE error when decoded size exceeds limit', () => {
      vi.mocked(Utilities.base64Decode).mockReturnValue(new Array(MAX_COVER_SIZE_BYTES + 1).fill(0));

      uploadCover(validPayload);

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.FILE_TOO_LARGE);
    });

    it('should not return FILE_TOO_LARGE when decoded size is exactly at the limit', () => {
      vi.mocked(Utilities.base64Decode).mockReturnValue(new Array(MAX_COVER_SIZE_BYTES).fill(0));

      uploadCover(validPayload);

      expect(parseResponse().ok).toBe(true);
    });

    it('should decode base64 data before checking size', () => {
      uploadCover(validPayload);

      expect(Utilities.base64Decode).toHaveBeenCalledWith(validPayload.data);
    });
  });

  describe('initialization check', () => {
    it('should return NOT_INITIALIZED when COVERS_FOLDER_ID is not set', () => {
      resetScriptProperties();

      uploadCover(validPayload);

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
    });

    it('should not check for duplicates when not initialized', () => {
      resetScriptProperties();

      uploadCover(validPayload);

      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });

  describe('deduplication (file already exists)', () => {
    it('should return reused: true when file with matching hash exists', () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: 'existing-file-id', description: MOCK_HASH }],
      });

      uploadCover(validPayload);

      expect(parseResponse().reused).toBe(true);
    });

    it('should return existing file_id when duplicate found', () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: 'existing-file-id', description: MOCK_HASH }],
      });

      uploadCover(validPayload);

      expect(parseResponse().file_id).toBe('existing-file-id');
    });

    it('should return thumbnail_url for existing file when duplicate found', () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: 'existing-file-id', description: MOCK_HASH }],
      });

      uploadCover(validPayload);

      expect(parseResponse().thumbnail_url).toBe(thumbnailUrl('existing-file-id'));
    });

    it('should not create a new file when duplicate found', () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: 'existing-file-id', description: MOCK_HASH }],
      });

      uploadCover(validPayload);

      expect(Drive.Files.create).not.toHaveBeenCalled();
    });

    it('should not reuse a file whose hash does not match', () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: 'other-file-id', description: 'different-hash' }],
      });

      uploadCover(validPayload);

      expect(parseResponse().reused).toBe(false);
    });

    it('should search for duplicates in the correct covers folder', () => {
      setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, 'my-covers-folder');

      uploadCover(validPayload);

      expect(Drive.Files.list).toHaveBeenCalledWith(
        expect.objectContaining({ q: expect.stringContaining('my-covers-folder') }),
      );
    });
  });

  describe('new file upload', () => {
    it('should return ok: true for a new upload', () => {
      uploadCover(validPayload);

      expect(parseResponse().ok).toBe(true);
    });

    it('should return reused: false for a new upload', () => {
      uploadCover(validPayload);

      expect(parseResponse().reused).toBe(false);
    });

    it('should return file_id of newly created file', () => {
      vi.mocked(Drive.Files.create).mockReturnValue({ id: 'new-file-id' });

      uploadCover(validPayload);

      expect(parseResponse().file_id).toBe('new-file-id');
    });

    it('should return thumbnail_url for newly created file', () => {
      vi.mocked(Drive.Files.create).mockReturnValue({ id: 'new-file-id' });

      uploadCover(validPayload);

      expect(parseResponse().thumbnail_url).toBe(thumbnailUrl('new-file-id'));
    });

    it('should upload new file to the covers folder', () => {
      uploadCover(validPayload);

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ parents: [COVERS_FOLDER_ID] }),
        expect.anything(),
      );
    });

    it('should store the content hash as the file description', () => {
      uploadCover(validPayload);

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: MOCK_HASH }),
        expect.anything(),
      );
    });

    it('should use hash prefix as the base of new filename', () => {
      uploadCover(validPayload);

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: expect.stringContaining(MOCK_HASH_PREFIX) }),
        expect.anything(),
      );
    });

    it('should use extension from original filename', () => {
      uploadCover({ ...validPayload, filename: 'photo.png' });

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: expect.stringMatching(/\.png$/) }),
        expect.anything(),
      );
    });

    it('should create blob with correct mime_type and filename', () => {
      uploadCover(validPayload);

      expect(Utilities.newBlob).toHaveBeenCalledWith(
        expect.anything(),
        validPayload.mime_type,
        expect.any(String),
      );
    });

    it('should set public reader permissions on new file', () => {
      vi.mocked(Drive.Files.create).mockReturnValue({ id: 'new-file-id' });

      uploadCover(validPayload);

      expect(Drive.Permissions.create).toHaveBeenCalledWith(
        { role: 'reader', type: 'anyone' },
        'new-file-id',
      );
    });
  });
});