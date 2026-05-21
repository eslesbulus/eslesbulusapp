import { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/context/AuthContext";

type ChatPreview = {
  user: UserProfile;
  lastMessage: string;
  time: string;
  unread: number;
};

const PREVIEW_TEXTS = [
  "Selam! Profilin çok ilgi çekici.",
  "Kahve içmek ister misin?",
  "Bu akşam müsait misin?",
  "Müzik zevkimiz benziyor olabilir mi?",
  "Profilindeki enerji harika!",
];

export default function ChatScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { profile } = useAuth();
  const { users } = useUsers();

  // Until a real `conversations` collection exists, show opposite-gender users
  // as conversation starters. The previews below are placeholder copy.
  const opposite = useMemo(() => {
    const g = profile?.gender === "Erkek" ? "Kadın" : profile?.gender === "Kadın" ? "Erkek" : null;
    return g ? users.filter((u) => u.gender === g) : users;
  }, [users, profile?.gender]);

  const chatList: ChatPreview[] = useMemo(
    () =>
      opposite.slice(0, 6).map((u, i) => ({
        user: u,
        lastMessage: PREVIEW_TEXTS[i % PREVIEW_TEXTS.length],
        time: ["şimdi", "5 dk", "1 sa", "3 sa", "dün", "Pzt"][i] ?? "",
        unread: 0,
      })),
    [opposite]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Sohbet</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>
          {chatList.length > 0 ? "Yeni bir sohbet başlat" : "Henüz sohbet yok"}
        </Text>
      </View>

      <FlatList
        data={chatList}
        keyExtractor={(it) => it.user.uid}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={36} color={c.textMuted} />
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Keşfet sekmesinden birine Hi gönder, sohbet burada açılır.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const photo = item.user.photoURL || item.user.photos?.[0];
          return (
            <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
              <Pressable
                onPress={() => router.push(`/chat/${item.user.uid}`)}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: c.card,
                    borderColor: c.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={styles.avatarWrap}>
                  {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: c.surface }]} />}
                  {item.user.online && (
                    <View
                      style={[styles.dot, { backgroundColor: c.online, borderColor: c.card }]}
                    />
                  )}
                </View>
                <View style={styles.middle}>
                  <View style={styles.topRow}>
                    <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                      {item.user.name}
                    </Text>
                    <Text style={[styles.time, { color: c.textMuted }]}>{item.time}</Text>
                  </View>
                  <View style={styles.bottomRow}>
                    <Text
                      style={[
                        styles.msg,
                        {
                          color: item.unread > 0 ? c.text : c.textMuted,
                          fontWeight: item.unread > 0 ? "600" : "400",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMessage}
                    </Text>
                    {item.unread > 0 && (
                      <View style={[styles.badge, { backgroundColor: c.primary }]}>
                        <Text style={styles.badgeText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const AV = 54;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: "center", padding: 32, gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center", maxWidth: 280 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrap: { width: AV, height: AV, position: "relative" },
  avatar: { width: AV, height: AV, borderRadius: AV / 2 },
  dot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  middle: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700" },
  time: { fontSize: 11, fontWeight: "500" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  msg: { fontSize: 13, flex: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
