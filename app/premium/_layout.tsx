import { Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function PremiumLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
