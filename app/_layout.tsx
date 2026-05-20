import { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { InteractionsProvider } from "@/context/InteractionsContext";
import { BlockedUsersProvider } from "@/context/BlockedUsersContext";
import { CoinsProvider } from "@/context/CoinsContext";
import { PremiumProvider } from "@/context/PremiumContext";

WebBrowser.maybeCompleteAuthSession();

function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return; // navigator not mounted yet
    if (loading) return;

    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!user) {
      if (!inAuth) router.replace("/(auth)/login");
    } else if (!profile?.profileComplete) {
      if (!inOnboarding) router.replace("/(onboarding)/profile-setup");
    } else {
      if (inAuth || inOnboarding) router.replace("/(tabs)");
    }
  }, [navState?.key, user, profile, loading, segments]);

  const { mode, theme } = useTheme();
  const bgColor = theme.colors.background;
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: bgColor },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <PremiumProvider>
            <InteractionsProvider>
              <BlockedUsersProvider>
                <CoinsProvider>
                  <RootNavigator />
                </CoinsProvider>
              </BlockedUsersProvider>
            </InteractionsProvider>
          </PremiumProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
