import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCover } from './get-cover';
import { ERROR_CODES } from '../helpers/response';
import { MAX_COVER_BATCH_SIZE } from '../helpers/constants';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

const FILE_ID_1 = 'file-id-1';
const FILE_ID_2 = 'file-id-2';
const MOCK_BASE64 = 'bW9ja2Jhc2U2NA==';
const MOCK_MIME_TYPE = 'image/jpeg';

describe('getCover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Drive.Files.get).mockReturnValue({ trashed: false } as never);
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getBlob: () => ({
        getBytes: () => [1, 2, 3],
        getContentType: () => MOCK_MIME_TYPE,
      }),
    } as never);
    vi.mocked(Utilities.base64Encode).mockReturnValue(MOCK_BASE64);
  });

  describe('validation', () => {
    it('should return ok: false when file_ids is missing', () => {
      getCover({} as Parameters<typeof getCover>[0]);

      expect(parseResponse().ok).toBe(false);
    });

    it('should return INVALID_PAYLOAD when file_ids is missing', () => {
      getCover({} as Parameters<typeof getCover>[0]);

      expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should return ok: false when file_ids is not an array', () => {
      getCover({ file_ids: 'not-an-array' } as unknown as Parameters<typeof getCover>[0]);

      expect(parseResponse().ok).toBe(false);
    });

    it('should return INVALID_PAYLOAD when file_ids is not an array', () => {
      getCover({ file_ids: 'not-an-array' } as unknown as Parameters<typeof getCover>[0]);

      expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should return ok: false when file_ids is empty array', () => {
      getCover({ file_ids: [] });

      expect(parseResponse().ok).toBe(false);
    });

    it('should return INVALID_PAYLOAD when file_ids is empty array', () => {
      getCover({ file_ids: [] });

      expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should return ok: false when file_ids count exceeds MAX_COVER_BATCH_SIZE', () => {
      const tooManyIds = Array.from({ length: MAX_COVER_BATCH_SIZE + 1 }, (_, i) => `file-id-${i}`);

      getCover({ file_ids: tooManyIds });

      expect(parseResponse().ok).toBe(false);
    });

    it('should return INVALID_PAYLOAD when file_ids count exceeds MAX_COVER_BATCH_SIZE', () => {
      const tooManyIds = Array.from({ length: MAX_COVER_BATCH_SIZE + 1 }, (_, i) => `file-id-${i}`);

      getCover({ file_ids: tooManyIds });

      expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should accept exactly MAX_COVER_BATCH_SIZE file_ids', () => {
      const maxIds = Array.from({ length: MAX_COVER_BATCH_SIZE }, (_, i) => `file-id-${i}`);

      getCover({ file_ids: maxIds });

      expect(parseResponse().ok).toBe(true);
    });
  });

  describe('single file retrieval', () => {
    it('should return ok: true for a valid file', () => {
      getCover({ file_ids: [FILE_ID_1] });

      expect(parseResponse().ok).toBe(true);
    });

    it('should return covers array for a valid file', () => {
      getCover({ file_ids: [FILE_ID_1] });

      const response = parseResponse();
      expect(Array.isArray(response.covers)).toBe(true);
    });

    it('should return one cover item for one file_id', () => {
      getCover({ file_ids: [FILE_ID_1] });

      const response = parseResponse();
      expect((response.covers as unknown[]).length).toBe(1);
    });

    it('should return file_id in cover item', () => {
      getCover({ file_ids: [FILE_ID_1] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].file_id).toBe(FILE_ID_1);
    });

    it('should return base64 data in cover item', () => {
      getCover({ file_ids: [FILE_ID_1] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].data).toBe(MOCK_BASE64);
    });

    it('should return mime_type in cover item', () => {
      getCover({ file_ids: [FILE_ID_1] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].mime_type).toBe(MOCK_MIME_TYPE);
    });

    it('should call DriveApp.getFileById with the correct file_id', () => {
      getCover({ file_ids: [FILE_ID_1] });

      expect(DriveApp.getFileById).toHaveBeenCalledWith(FILE_ID_1);
    });

    it('should encode file bytes with Utilities.base64Encode', () => {
      const mockBytes = [10, 20, 30];
      vi.mocked(DriveApp.getFileById).mockReturnValue({
        getBlob: () => ({
          getBytes: () => mockBytes,
          getContentType: () => MOCK_MIME_TYPE,
        }),
      } as never);

      getCover({ file_ids: [FILE_ID_1] });

      expect(Utilities.base64Encode).toHaveBeenCalledWith(mockBytes);
    });
  });

  describe('FILE_NOT_FOUND handling', () => {
    it('should return FILE_NOT_FOUND error in cover item when file does not exist', () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error('File not found');
      });

      getCover({ file_ids: [FILE_ID_1] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
    });

    it('should return file_id in error cover item', () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error('File not found');
      });

      getCover({ file_ids: [FILE_ID_1] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].file_id).toBe(FILE_ID_1);
    });

    it('should not return data when file does not exist', () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error('File not found');
      });

      getCover({ file_ids: [FILE_ID_1] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].data).toBeUndefined();
    });

    it('should still return ok: true even when a file is not found', () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error('File not found');
      });

      getCover({ file_ids: [FILE_ID_1] });

      expect(parseResponse().ok).toBe(true);
    });
  });

  describe('batch retrieval', () => {
    it('should return two cover items for two file_ids', () => {
      getCover({ file_ids: [FILE_ID_1, FILE_ID_2] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers.length).toBe(2);
    });

    it('should return partial success when some files exist and some do not', () => {
      vi.mocked(DriveApp.getFileById)
        .mockReturnValueOnce({
          getBlob: () => ({
            getBytes: () => [1, 2, 3],
            getContentType: () => MOCK_MIME_TYPE,
          }),
        } as never)
        .mockImplementationOnce(() => {
          throw new Error('File not found');
        });

      getCover({ file_ids: [FILE_ID_1, FILE_ID_2] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].data).toBe(MOCK_BASE64);
      expect(covers[1].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
    });

    it('should process remaining files after one fails', () => {
      vi.mocked(DriveApp.getFileById)
        .mockImplementationOnce(() => {
          throw new Error('File not found');
        })
        .mockReturnValueOnce({
          getBlob: () => ({
            getBytes: () => [1, 2, 3],
            getContentType: () => MOCK_MIME_TYPE,
          }),
        } as never);

      getCover({ file_ids: [FILE_ID_1, FILE_ID_2] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
      expect(covers[1].data).toBe(MOCK_BASE64);
    });

    it('should preserve file_id order in response', () => {
      getCover({ file_ids: [FILE_ID_1, FILE_ID_2] });

      const covers = parseResponse().covers as Array<Record<string, unknown>>;
      expect(covers[0].file_id).toBe(FILE_ID_1);
      expect(covers[1].file_id).toBe(FILE_ID_2);
    });
  });
});
