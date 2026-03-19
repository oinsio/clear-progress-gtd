import { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as React from "react";
import i18n from "@/i18n";
import type { Language } from "@/constants";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, STORAGE_KEYS } from "@/constants";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectBrowserLanguage(): Language | null {
  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const browserLang of browserLanguages) {
    const langCode = browserLang.split("-")[0] as Language;
    if (SUPPORTED_LANGUAGES.includes(langCode)) {
      return langCode;
    }
  }
  return null;
}

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
      return stored as Language;
    }
    const detectedLanguage = detectBrowserLanguage() ?? DEFAULT_LANGUAGE;
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, detectedLanguage);
    return detectedLanguage;
  } catch {
    // localStorage недоступен
    return detectBrowserLanguage() ?? DEFAULT_LANGUAGE;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // i18next инициализируется до React (при импорте модуля), поэтому синхронизируем
  // определённый язык с i18next при монтировании компонента
  useEffect(() => {
    void i18n.changeLanguage(language);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    void i18n.changeLanguage(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
