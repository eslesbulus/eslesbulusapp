import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildTheme, Theme, ThemeMode } from "@/constants/theme";

type ThemeContextType = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [hydrated, setHydrated] = useState(false);
  // Kullanici manuel secim yaptiysa sistem temasini takip etme
  const userChoseRef = useRef(false);

  // Kayitli tercihi yukle (manuel secim sistem temasini ezmez)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (saved === "light" || saved === "dark")) {
          userChoseRef.current = true;
          setModeState(saved);
        } else if (!cancelled && (systemScheme === "light" || systemScheme === "dark")) {
          setModeState(systemScheme);
        }
      } catch {}
      if (!cancelled) setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Sistem temasi degisince — yalnizca kullanici manuel secim yapmadiysa takip et
  useEffect(() => {
    if (!hydrated) return;
    if (userChoseRef.current) return;
    if (systemScheme === "light" || systemScheme === "dark") {
      setModeState(systemScheme);
    }
  }, [systemScheme, hydrated]);

  const setMode = (m: ThemeMode) => {
    userChoseRef.current = true;
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      setMode,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [theme, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
