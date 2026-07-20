import tr, { TranslationKeys } from "./tr";
import en from "./en";

export type Language = "tr" | "en";

const translations: Record<Language, Record<TranslationKeys, string>> = { tr, en };

export function translate(lang: Language, key: TranslationKeys, params?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] ?? translations.tr[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export type { TranslationKeys };
