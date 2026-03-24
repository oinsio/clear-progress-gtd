import { vi } from 'vitest';
import { PROPERTY_KEYS } from '../../src/helpers/constants';
import { resetScriptProperties, setScriptProperty } from '../setup/gas-mocks';

export const DEFAULT_COVERS_FOLDER_ID = 'covers-folder-id';

export function setupCoverMocks(): void {
  vi.clearAllMocks();
  resetScriptProperties();
  setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, DEFAULT_COVERS_FOLDER_ID);
  vi.mocked(Utilities.base64Decode).mockReturnValue([]);
  vi.mocked(Utilities.computeDigest).mockReturnValue(Array(32).fill(0));
  vi.mocked(Utilities.newBlob).mockReturnValue({} as never);
  vi.mocked(Drive.Files.list).mockReturnValue({ files: [] });
  vi.mocked(Drive.Files.create).mockReturnValue({ id: 'new-file-id' });
}
