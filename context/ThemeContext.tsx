import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildTheme, Theme, ThemeMode, ThemePreference } from "@/constants/theme";

type ThemeContextType = {
  theme: Theme;
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "theme_preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPrefState] = useState<ThemePreference>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (saved === "system" || saved === "light" || saved === "dark")) {
          setPrefState(saved);
        }
      } catch {}
      if (!cancelled) setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const resolvedMode: ThemeMode =
    preference === "system"
      ? (systemScheme === "light" ? "light" : "dark")
      : preference;

  const setPreference = (p: ThemePreference) => {
    setPrefState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
  };

  const theme = useMemo(() => buildTheme(resolvedMode), [resolvedMode]);

  const value = useMemo(
    () => ({
      theme,
      mode: resolvedMode,
      preference,
      setPreference,
      toggle: () => setPreference(resolvedMode === "dark" ? "light" : "dark"),
    }),
    [theme, resolvedMode, preference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
