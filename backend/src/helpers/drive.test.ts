import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driveFileExists } from './drive';
import { DRIVE_QUERY_FIELDS } from './constants';

describe('driveFileExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when file exists and is not trashed', () => {
    vi.mocked(Drive.Files.get).mockReturnValue({ trashed: false } as never);

    expect(driveFileExists('file-abc')).toBe(true);
  });

  it('should return false when file exists but is trashed', () => {
    vi.mocked(Drive.Files.get).mockReturnValue({ trashed: true } as never);

    expect(driveFileExists('file-abc')).toBe(false);
  });

  it('should return false when Drive.Files.get throws', () => {
    vi.mocked(Drive.Files.get).mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(driveFileExists('file-abc')).toBe(false);
  });

  it('should call Drive.Files.get with the given file id', () => {
    vi.mocked(Drive.Files.get).mockReturnValue({ trashed: false } as never);

    driveFileExists('my-file-id');

    expect(Drive.Files.get).toHaveBeenCalledWith('my-file-id', expect.anything());
  });

  it('should request only the required fields from Drive', () => {
    vi.mocked(Drive.Files.get).mockReturnValue({ trashed: false } as never);

    driveFileExists('file-abc');

    expect(Drive.Files.get).toHaveBeenCalledWith(expect.anything(), { fields: DRIVE_QUERY_FIELDS.FILE_EXISTS });
  });
});