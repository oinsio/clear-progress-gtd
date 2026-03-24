import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadCovers } from './upload-covers';
import { ERROR_CODES } from '../helpers/response';
import { MAX_COVER_BATCH_SIZE, COVER_HASH_PREFIX_LENGTH, PROPERTY_KEYS } from '../helpers/constants';
import { resetScriptProperties, setScriptProperty } from '../../tests/setup/gas-mocks';
import { setupCoverMocks } from '../../tests/helpers/cover-mocks';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

function parseResults(): Array<Record<string, unknown>> {
  return parseResponse().results as Array<Record<string, unknown>>;
}

const MOCK_HASH = '00'.repeat(32);
const MOCK_HASH_PREFIX = '0'.repeat(COVER_HASH_PREFIX_LENGTH);

const validCover = {
  local_id: 'local-uuid-1',
  goal_id: 'goal-uuid-1',
  filename: 'cover.jpg',
  mime_type: 'image/jpeg',
  data: 'base64_encoded_data',
};

describe('uploadCovers', () => {
  beforeEach(() => {
    setupCoverMocks();
  });

  describe('payload validation', () => {
    it('should return INVALID_PAYLOAD when covers is not an array', () => {
      uploadCovers({ covers: 'not-an-array' as never });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should return INVALID_PAYLOAD when covers is an empty array', () => {
      uploadCovers({ covers: [] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should return INVALID_PAYLOAD when covers.length exceeds MAX_COVER_BATCH_SIZE', () => {
      const tooManyCovers = Array(MAX_COVER_BATCH_SIZE + 1).fill(validCover);

      uploadCovers({ covers: tooManyCovers });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should accept covers.length === MAX_COVER_BATCH_SIZE (boundary)', () => {
      const covers = Array(MAX_COVER_BATCH_SIZE)
        .fill(null)
        .map((_, i) => ({ ...validCover, local_id: `local-${i}`, goal_id: `goal-${i}` }));

      uploadCovers({ covers });

      expect(parseResponse().ok).toBe(true);
    });

    it('should not call Drive.Files.list when covers array is empty', () => {
      uploadCovers({ covers: [] });

      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });

  describe('initialization check', () => {
    it('should return NOT_INITIALIZED when COVERS_FOLDER_ID is not set', () => {
      resetScriptProperties();

      uploadCovers({ covers: [validCover] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
    });

    it('should not call Drive.Files.list when not initialized', () => {
      resetScriptProperties();

      uploadCovers({ covers: [validCover] });

      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });

  describe('Drive.Files.list call optimization', () => {
    it('should call Drive.Files.list exactly once regardless of covers count', () => {
      const covers = [
        { ...validCover, local_id: 'local-1', goal_id: 'goal-1' },
        { ...validCover, local_id: 'local-2', goal_id: 'goal-2' },
        { ...validCover, local_id: 'local-3', goal_id: 'goal-3' },
      ];

      uploadCovers({ covers });

      expect(Drive.Files.list).toHaveBeenCalledTimes(1);
    });

    it('should search in the correct covers folder', () => {
      setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, 'my-covers-folder');

      uploadCovers({ covers: [validCover] });

      expect(Drive.Files.list).toHaveBeenCalledWith(
        expect.objectContaining({ q: expect.stringContaining('my-covers-folder') }),
      );
    });
  });

  describe('results array', () => {
    it('should return ok: true with results array', () => {
      uploadCovers({ covers: [validCover] });

      const response = parseResponse();
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.results)).toBe(true);
    });

    it('should return one result per input cover', () => {
      const covers = [
        { ...validCover, local_id: 'local-1', goal_id: 'goal-1' },
        { ...validCover, local_id: 'local-2', goal_id: 'goal-2' },
      ];

      uploadCovers({ covers });

      expect((parseResponse().results as unknown[]).length).toBe(2);
    });

    it('should echo local_id in each result', () => {
      uploadCovers({ covers: [{ ...validCover, local_id: 'my-local-id' }] });

      const results = parseResults();
      expect(results[0].local_id).toBe('my-local-id');
    });

    it('should echo goal_id in each result', () => {
      uploadCovers({ covers: [{ ...validCover, goal_id: 'my-goal-id' }] });

      const results = parseResults();
      expect(results[0].goal_id).toBe('my-goal-id');
    });
  });

  describe('successful upload', () => {
    it('should return file_id and reused: false for new upload', () => {
      uploadCovers({ covers: [validCover] });

      const results = parseResults();
      expect(results[0].file_id).toBe('new-file-id');
      expect(results[0].reused).toBe(false);
    });

    it('should return reused: true when cover with matching hash already exists', () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: 'existing-file-id', description: MOCK_HASH }],
      });

      uploadCovers({ covers: [validCover] });

      const results = parseResults();
      expect(results[0].reused).toBe(true);
      expect(results[0].file_id).toBe('existing-file-id');
    });

    it('should name new file using hash prefix and extension', () => {
      uploadCovers({ covers: [{ ...validCover, filename: 'photo.png' }] });

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: `${MOCK_HASH_PREFIX}.png` }),
        expect.anything(),
      );
    });

    it('should set public reader permissions on newly created file', () => {
      uploadCovers({ covers: [validCover] });

      expect(Drive.Permissions.create).toHaveBeenCalledWith(
        { role: 'reader', type: 'anyone' },
        'new-file-id',
      );
    });
  });

  describe('per-item error isolation', () => {
    it.each([
      ['invalid mime_type', { ...validCover, local_id: 'local-1', mime_type: 'application/pdf' }],
      ['missing data', { ...validCover, local_id: 'local-1', data: '' }],
    ])('should return per-item error for %s without failing the whole batch', (_, invalidCover) => {
      const covers = [invalidCover, { ...validCover, local_id: 'local-2', goal_id: 'goal-2' }];

      uploadCovers({ covers });

      expect(parseResponse().ok).toBe(true);
      const results = parseResults();
      expect(results[0].error).toBeDefined();
      expect(results[1].file_id).toBeDefined();
    });

    it('should return per-item error for oversized file without failing the whole batch', () => {
      vi.mocked(Utilities.base64Decode).mockImplementation(() => {
        const callIndex = (Utilities.base64Decode as ReturnType<typeof vi.fn>).mock.calls.length - 1;
        if (callIndex === 0) return new Array(MAX_COVER_BATCH_SIZE * 1024 * 1024 + 1).fill(0);
        return [];
      });

      const covers = [
        { ...validCover, local_id: 'local-big' },
        { ...validCover, local_id: 'local-ok', goal_id: 'goal-2' },
      ];

      uploadCovers({ covers });

      const response = parseResponse();
      expect(response.ok).toBe(true);
    });

    it('should return ok: true even when all items fail validation', () => {
      const covers = [
        { ...validCover, local_id: 'local-1', mime_type: 'application/pdf' },
        { ...validCover, local_id: 'local-2', mime_type: 'text/plain' },
      ];

      uploadCovers({ covers });

      expect(parseResponse().ok).toBe(true);
      const results = parseResults();
      expect(results[0].error).toBeDefined();
      expect(results[1].error).toBeDefined();
    });

    it('should not include error field in successful result', () => {
      uploadCovers({ covers: [validCover] });

      const results = parseResults();
      expect(results[0].error).toBeUndefined();
    });
  });
});
