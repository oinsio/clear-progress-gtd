import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCover } from './delete-cover';
import { ERROR_CODES } from '../helpers/response';

vi.mock('../sheets/goals.sheet', () => ({ getCoverFileIds: vi.fn() }));

import { getCoverFileIds } from '../sheets/goals.sheet';

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

describe('deleteCover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoverFileIds).mockReturnValue([]);
  });

  describe('payload validation', () => {
    it('should return INVALID_PAYLOAD error when file_id is empty string', () => {
      deleteCover({ file_id: '' });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it('should not call getCoverFileIds when file_id is missing', () => {
      deleteCover({ file_id: '' });

      expect(getCoverFileIds).not.toHaveBeenCalled();
    });
  });

  describe('ref_count check (file still referenced)', () => {
    it('should return deleted: false when file is referenced by one goal', () => {
      vi.mocked(getCoverFileIds).mockReturnValue(['file-abc']);

      deleteCover({ file_id: 'file-abc' });

      expect(parseResponse()).toMatchObject({ ok: true, deleted: false, ref_count: 1 });
    });

    it('should return correct ref_count when file is referenced by multiple goals', () => {
      vi.mocked(getCoverFileIds).mockReturnValue(['file-abc', 'file-abc', 'file-abc']);

      deleteCover({ file_id: 'file-abc' });

      expect(parseResponse().ref_count).toBe(3);
    });

    it('should not call Drive.Files.update when file is still referenced', () => {
      vi.mocked(getCoverFileIds).mockReturnValue(['file-abc']);

      deleteCover({ file_id: 'file-abc' });

      expect(Drive.Files.update).not.toHaveBeenCalled();
    });

    it('should not count other file ids toward ref_count', () => {
      vi.mocked(getCoverFileIds).mockReturnValue(['file-other', 'file-abc']);

      deleteCover({ file_id: 'file-abc' });

      expect(parseResponse().ref_count).toBe(1);
    });
  });

  describe('successful deletion (file not referenced)', () => {
    it('should return deleted: true when file has no references', () => {
      vi.mocked(getCoverFileIds).mockReturnValue([]);

      deleteCover({ file_id: 'file-abc' });

      expect(parseResponse()).toMatchObject({ ok: true, deleted: true, ref_count: 0 });
    });

    it('should call Drive.Files.update with trashed: true', () => {
      deleteCover({ file_id: 'file-abc' });

      expect(Drive.Files.update).toHaveBeenCalledWith({ trashed: true }, 'file-abc');
    });

    it('should trash the correct file', () => {
      deleteCover({ file_id: 'file-xyz' });

      expect(Drive.Files.update).toHaveBeenCalledWith(expect.anything(), 'file-xyz');
    });
  });

  describe('Drive error handling', () => {
    it('should return FILE_NOT_FOUND error when Drive.Files.update throws', () => {
      vi.mocked(Drive.Files.update).mockImplementation(() => {
        throw new Error('Not found');
      });

      deleteCover({ file_id: 'file-abc' });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.FILE_NOT_FOUND);
    });

    it('should include file_id in the error message when Drive throws', () => {
      vi.mocked(Drive.Files.update).mockImplementation(() => {
        throw new Error('Not found');
      });

      deleteCover({ file_id: 'file-abc' });

      expect(parseResponse().message).toContain('file-abc');
    });
  });
});