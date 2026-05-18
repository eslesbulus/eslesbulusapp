import { Tabs } from "expo-router";
import { Text } from "react-native";

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 22 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E91E63",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "🔥" : "🔍"} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Eşleşmeler",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "💬" : "💭"} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "👤" : "🙂"} />,
        }}
      />
    </Tabs>
  );
}
