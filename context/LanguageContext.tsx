import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { translate, Language, TranslationKeys } from "@/i18n";

type LanguageContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Sistem dili — AsyncStorage'da kayıt yoksa kullan
  const systemLang: Language = (() => {
    try {
      const tag = getLocales()[0]?.languageTag ?? "tr";
      return tag.startsWith("en") ? "en" : "tr";
    } catch { return "tr"; }
  })();

  const [lang, setLangState] = useState<Language>(systemLang);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (saved === "tr" || saved === "en")) {
          setLangState(saved);
        }
        // Kayıt yoksa sistem dilini kullan (varsayılan zaten systemLang)
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
