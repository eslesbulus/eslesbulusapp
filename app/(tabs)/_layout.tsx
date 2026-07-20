import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View, Text } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useChats } from "@/hooks/useChats";

export default function TabsLayout() {
  const { theme, mode } = useTheme();
  const { t } = useLanguage();
  const c = theme.colors;
  const { totalUnreadChats } = useChats();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.background },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: -2 },
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor:
            Platform.OS === "android" ? c.surface : "transparent",
          height: Platform.OS === "ios" ? 84 : 64,
          paddingTop: 6,
        },
        tabBarBackground:
          Platform.OS === "ios"
            ? () => (
                <BlurView
                  tint={mode === "dark" ? "dark" : "light"}
                  intensity={80}
                  style={StyleSheet.absoluteFill}
                />
              )
            : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab_discover"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "compass" : "compass-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: t("tab_matches"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "heart" : "heart-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: t("tab_posts"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "add-circle" : "add-circle-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tab_chat"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "chatbubble" : "chatbubble-outline"}
              color={color}
              badge={totalUnreadChats}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tab_profile"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  size = 24,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
  badge?: number;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={name} size={size} color={color} />
      {badge != null && badge > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>
            {badge > 9 ? "9+" : badge}
          </Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF4D6D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#000",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
});
