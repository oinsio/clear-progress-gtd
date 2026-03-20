const mockStorageData: Record<string, string> = {};

export const localStorageMock: Storage = {
  getItem: (key: string) => mockStorageData[key] ?? null,
  setItem: (key: string, value: string) => { mockStorageData[key] = value; },
  removeItem: (key: string) => { delete mockStorageData[key]; },
  clear: () => { Object.keys(mockStorageData).forEach((k) => delete mockStorageData[k]); },
  key: (index: number) => Object.keys(mockStorageData)[index] ?? null,
  get length() { return Object.keys(mockStorageData).length; },
};

Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });
