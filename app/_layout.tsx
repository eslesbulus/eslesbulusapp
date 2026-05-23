import { useEffect, useRef } from "react";
import { LogBox, AppState } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { getSocket } from "@/config/socket";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { InteractionsProvider } from "@/context/InteractionsContext";
import { BlockedUsersProvider } from "@/context/BlockedUsersContext";
import { CoinsProvider } from "@/context/CoinsContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

WebBrowser.maybeCompleteAuthSession();

// Socket reconnect ve push notification uyarılarını gizle
LogBox.ignoreLogs([
  "Socket",
  "connect error",
  "expo-notifications",
  "Push notifications",
]);

function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  // Push notification kaydı ve dinleyicisi
  usePushNotifications();

  // AppState takibi — arka plana alınca/kapanınca "son görülme" güncelle
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (!user) return;
      const socket = getSocket();
      if (prev === "active" && (nextState === "background" || nextState === "inactive")) {
        // Arka plana geçti — offline olarak işaretle
        socket?.emit("user:goBackground");
      } else if ((prev === "background" || prev === "inactive") && nextState === "active") {
        // Ön plana döndü — online olarak işaretle
        socket?.emit("user:goForeground");
      }
    });
    return () => sub.remove();
  }, [user]);

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
