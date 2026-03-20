import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";
import house from "@/locales/house.json";
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from "@/constants";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ru: { translation: ru }, en: { translation: en }, house: { translation: house } },
    fallbackLng: DEFAULT_LANGUAGE,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
