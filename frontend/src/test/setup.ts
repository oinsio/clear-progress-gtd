import "fake-indexeddb/auto";
import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// Node.js 22+ has a built-in global `localStorage` that lacks Web Storage API methods.
// Override it with a fully functional in-memory implementation for all tests.
const createLocalStorageMock = (): Storage => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
};

Object.defineProperty(globalThis, "localStorage", {
  value: createLocalStorageMock(),
  writable: true,
  configurable: true,
});

// jsdom doesn't support URL.createObjectURL/revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";

void i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, en: { translation: en } },
  lng: "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
