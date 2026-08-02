module.exports = {
  expo: {
    name: "Eşleş Buluş - Flört & Sohbet",
    slug: "eslesbulusapp",
    version: "2.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
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
      versionCode: 3,
      // FCM / push bildirim — cihazin push token alabilmesi icin gerekli
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-localization",
      "./plugins/withFixAudioForegroundService",
      // Facebook SDK — yukleme ve satin alim (App Events) takibi icin.
      // strings.xml / AndroidManifest / Info.plist duzenlemelerini bu plugin
      // prebuild sirasinda otomatik yapar, elle dosya duzenlemeye gerek yok.
      // NOT: App Secret ASLA buraya yazilmaz, o sunucu tarafi bir sirdir.
      [
        "react-native-fbsdk-next",
        {
          appID: "1323949806483991",
          clientToken: "98dfb80125026747575035b1d86b4561",
          displayName: "Eşleş Buluş",
          scheme: "fb1323949806483991",
          isAutoInitEnabled: true,
          autoLogAppEventsEnabled: true,
          advertiserIDCollectionEnabled: true,
          iosUserTrackingPermission:
            "Sana daha uygun içerik ve kampanyalar gösterebilmek için kullanılır.",
        },
      ],
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
      "@react-native-google-signin/google-signin",
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
