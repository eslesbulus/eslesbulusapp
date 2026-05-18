import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { AuthProvider, useAuth } from "@/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
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
  }, [user, profile, loading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
