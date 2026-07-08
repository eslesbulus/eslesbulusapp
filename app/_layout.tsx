import { useEffect, useRef, useState, useCallback } from "react";
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
import { CustomAlertProvider } from "@/components/common/CustomAlert";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BASE_URL } from "@/config/api";
import MaintenanceScreen from "@/components/MaintenanceScreen";

// ── Global bakım state — hem RootLayout hem RootNavigator erişir ──
let _maintenanceListeners: Array<(data: { maintenance: boolean; message: string; endDate: string | null }) => void> = [];

export function setMaintenanceState(data: { maintenance: boolean; message: string; endDate: string | null }) {
  _maintenanceListeners.forEach(fn => fn(data));
}

function useMaintenancePolling() {
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [maintenanceEnd, setMaintenanceEnd] = useState<string | null>(null);

  const apply = useCallback((data: { maintenance: boolean; message: string; endDate: string | null }) => {
    setMaintenance(!!data.maintenance);
    setMaintenanceMsg(data.message || "");
    setMaintenanceEnd(data.endDate || null);
  }, []);

  // Socket event'ten gelen güncellemeleri dinle
  useEffect(() => {
    _maintenanceListeners.push(apply);
    return () => {
      _maintenanceListeners = _maintenanceListeners.filter(fn => fn !== apply);
    };
  }, [apply]);

  // HTTP ile kontrol fonksiyonu
  const check = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${BASE_URL}/api/maintenance/status`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      apply(data);
    } catch {}
  }, [apply]);

  // İlk açılış
  useEffect(() => { check(); }, []);

  // Ön plana gelince kontrol
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  // Sürekli polling — 10 saniyede bir (hafif endpoint, sorun olmaz)
  useEffect(() => {
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [check]);

  return { maintenance, maintenanceMsg, maintenanceEnd };
}

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

  // Socket hazır olduğunda bakım event'ini dinle — anlık geçiş
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (data: { maintenance: boolean; message?: string; endDate?: string | null }) => {
      setMaintenanceState({
        maintenance: !!data.maintenance,
        message: data.message || "",
        endDate: data.endDate || null,
      });
    };

    socket.on("app:maintenance", handler);
    return () => { socket.off("app:maintenance", handler); };
  }, []);

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

// Bakım kontrolü — ThemeProvider'ın ALTINDA kalır ki tema (ve kullanıcı tercihi)
// bakım moduna girip çıkarken sıfırlanmasın. Bakım ekranı da temayı kullanır.
function MaintenanceGate() {
  const { maintenance, maintenanceMsg, maintenanceEnd } = useMaintenancePolling();

  if (maintenance) {
    return <MaintenanceScreen message={maintenanceMsg} endDate={maintenanceEnd} />;
  }

  return (
    <AuthProvider>
      <PremiumProvider>
        <InteractionsProvider>
          <BlockedUsersProvider>
            <CoinsProvider>
              <CustomAlertProvider>
                <RootNavigator />
              </CustomAlertProvider>
            </CoinsProvider>
          </BlockedUsersProvider>
        </InteractionsProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}

function ThemedRoot() {
  const { theme } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MaintenanceGate />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedRoot />
    </ThemeProvider>
  );
}
