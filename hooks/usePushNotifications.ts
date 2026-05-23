import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { type EventSubscription } from "expo-modules-core";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/config/api";

// Expo Go'da push notification yok (SDK 53+), dev build gerekli
const isExpoGo = Constants.appOwnership === "expo";

// Foreground'da bildirim göster (sadece dev build'de)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo Go'da push notification çalışmaz
  if (isExpoGo) {
    console.log("Push notifications are not available in Expo Go, skipping");
    return null;
  }

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Genel Bildirimler",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF4D6D",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync("messages", {
      name: "Mesajlar",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF4D6D",
      sound: "default",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (err) {
    console.error("Failed to get push token:", err);
    return null;
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<EventSubscription>(null);
  const responseListener = useRef<EventSubscription>(null);

  useEffect(() => {
    if (!user?.uid || isExpoGo) return;

    // Push token kaydet
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        api.post("/api/users/me/push-token", { token, platform: Platform.OS }).catch(() => {});
      }
    });

    // Foreground'da bildirim geldiğinde
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Bildirim geldi — state güncellemesi gerekirse burada yapılır
      const data = notification.request.content.data;
      console.log("Notification received:", data?.type);
    });

    // Bildirime tıklanınca yönlendirme
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (!data) return;

      switch (data.type) {
        case "message":
        case "storyReply":
          if (data.senderId) {
            router.push(`/chat/${data.senderId}`);
          }
          break;

        case "like":
        case "profile_view":
          if (data.userId) {
            router.push(`/user/${data.userId}`);
          }
          break;

        case "match":
          router.push("/(tabs)/matches");
          break;

        case "story_view":
          if (data.storyId) {
            router.push(`/story/${data.storyId}`);
          }
          break;

        default:
          break;
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.uid]);
}
