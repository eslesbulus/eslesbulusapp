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
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.eslesbulus.eslesbulusapp",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.eslesbulus.eslesbulusapp",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      // TODO: Google Sign-In — Expo Go'da native modül yok. APK build için aktif et.
      // "@react-native-google-signin/google-signin",
      "expo-video",
      "expo-web-browser",
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#FF4D6D",
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
