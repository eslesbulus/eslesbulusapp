module.exports = {
  expo: {
    name: "EslesBulus",
    slug: "eslesbulusapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "eslesbulusapp",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#440d1e",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.eslesbulus.eslesbulusapp",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#440d1e",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.eslesbulus.eslesbulusapp",
      // FCM / push bildirim — cihazin push token alabilmesi icin gerekli
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      // Backend HTTP (cleartext) — APK'da http://IP'ye erişim icin gerekli.
      // Aksi halde Android cleartext trafigi engeller, login sonrasi profil cekilemez.
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      // TODO: Google Sign-In — Expo Go'da native modül yok. APK build için aktif et.
      // "@react-native-google-signin/google-signin",
      "expo-video",
      [
        "expo-audio",
        {
          microphonePermission: "Sesli mesaj kaydetmek için mikrofon erişimi gerekiyor.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Hesabını doğrulamak için selfie çekmen gerekiyor.",
          recordAudioAndroid: false,
        },
      ],
      "expo-web-browser",
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#440d1e",
          defaultChannel: "default",
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "641b5f53-9f42-4bde-906b-b1f753bdd2c1",
      },
    },
  },
};
