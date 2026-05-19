// Tek kaynak — palette burada. UI hard-coded renk kullanmaz.
// Açıklama için: THEME.md

export const palette = {
  primary: "#800020",
  primaryDark: "#4C0013",
  online: "#4CAF50",
  white: "#FFFFFF",
  black: "#000000",
};

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  background: string;
  surface: string;
  card: string;
  secondary: string;
  text: string;
  textMuted: string;
  inputBg: string;
  border: string;
  online: string;
  overlay: string;
};

export const darkColors: ThemeColors = {
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  background: "#0A0A0A",
  surface: "#1E1E1E",
  card: "#1a1a1a",
  secondary: "#D4AF37",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  inputBg: "#333333",
  border: "rgba(255,255,255,0.08)",
  online: palette.online,
  overlay: "rgba(0,0,0,0.6)",
};

export const lightColors: ThemeColors = {
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  background: "#F5F5F7",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  secondary: "#B8941F",
  text: "#1C1C1E",
  textMuted: "#6E6E73",
  inputBg: "#F2F2F7",
  border: "rgba(0,0,0,0.06)",
  online: palette.online,
  overlay: "rgba(0,0,0,0.4)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "500" as const },
  button: { fontSize: 15, fontWeight: "700" as const },
};

export type ThemeMode = "light" | "dark";

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    typography,
  };
}
