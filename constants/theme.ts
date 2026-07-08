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
  background: "#121217",
  surface: "#1C1C24",
  card: "#1A1A22",
  secondary: "#D4AF37",
  text: "#F0F0F5",
  textMuted: "#9898A8",
  inputBg: "#28283A",
  border: "rgba(255,255,255,0.10)",
  online: palette.online,
  overlay: "rgba(0,0,0,0.55)",
};

export const lightColors: ThemeColors = {
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  background: "#F7F7FA",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  secondary: "#B8941F",
  text: "#1C1C1E",
  textMuted: "#6B6B78",
  inputBg: "#F0F0F5",
  border: "rgba(0,0,0,0.07)",
  online: palette.online,
  overlay: "rgba(0,0,0,0.35)",
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
