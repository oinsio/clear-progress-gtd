/// <reference lib="esnext" />
import { vi } from 'vitest';

// --- ContentService mock ---

const mockTextOutput = {
  setMimeType: vi.fn().mockReturnThis(),
  getContent: vi.fn().mockReturnValue(''),
  getMimeType: vi.fn().mockReturnValue('application/json'),
};

vi.stubGlobal('ContentService', {
  createTextOutput: vi.fn().mockReturnValue(mockTextOutput),
  MimeType: { JSON: 'application/json' },
});

// --- PropertiesService mock ---

const scriptPropertiesStore: Record<string, string> = {};

const mockScriptProperties = {
  getProperty: vi.fn((key: string) => scriptPropertiesStore[key] ?? null),
  setProperty: vi.fn((key: string, value: string) => { scriptPropertiesStore[key] = value; }),
  setProperties: vi.fn((props: Record<string, string>) => { Object.assign(scriptPropertiesStore, props); }),
  deleteAllProperties: vi.fn(() => { Object.keys(scriptPropertiesStore).forEach(key => delete scriptPropertiesStore[key]); }),
};

vi.stubGlobal('PropertiesService', {
  getScriptProperties: vi.fn().mockReturnValue(mockScriptProperties),
});

// --- SpreadsheetApp mock ---

vi.stubGlobal('SpreadsheetApp', {
  openById: vi.fn(),
});

// --- Drive mock ---

vi.stubGlobal('Drive', {
  Files: {
    get: vi.fn(),
    create: vi.fn(),
    list: vi.fn().mockReturnValue({ files: [] }),
    update: vi.fn(),
  },
  Permissions: {
    create: vi.fn(),
  },
});

// --- DriveApp mock ---

const mockBlob = {
  getBytes: vi.fn().mockReturnValue([]),
  getContentType: vi.fn().mockReturnValue('image/jpeg'),
  getDataAsString: vi.fn().mockReturnValue(''),
};

const mockDriveFile = {
  getBlob: vi.fn().mockReturnValue(mockBlob),
};

vi.stubGlobal('DriveApp', {
  getFileById: vi.fn().mockReturnValue(mockDriveFile),
});

// --- Utilities mock ---

vi.stubGlobal('Utilities', {
  base64Decode: vi.fn().mockReturnValue([]),
  base64Encode: vi.fn().mockReturnValue('bW9ja2Jhc2U2NA=='),
  computeDigest: vi.fn().mockReturnValue(Array(32).fill(0)),
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  newBlob: vi.fn().mockReturnValue({}),
});

// Helpers to reset mocks and state between tests
export function resetScriptProperties(): void {
  Object.keys(scriptPropertiesStore).forEach(key => delete scriptPropertiesStore[key]);
}

export function setScriptProperty(key: string, value: string): void {
  scriptPropertiesStore[key] = value;
}

export function getScriptPropertiesStore(): Record<string, string> {
  return scriptPropertiesStore;
}
