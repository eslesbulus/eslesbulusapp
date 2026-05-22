import { View, Text, StyleSheet, FlatList, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useChats } from "@/hooks/useChats";
import { useUser } from "@/hooks/useUser";
import { VipName } from "@/components/common/VipName";
import type { Timestamp } from "firebase/firestore";

function formatChatTime(ts: Timestamp | null): string {
  if (!ts) return "";
  const d = ts.toDate();
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins} dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { chats, loading } = useChats();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Sohbet</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>
          {chats.length > 0 ? `${chats.length} sohbet` : "Henüz sohbet yok"}
        </Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(it) => it.chatId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>Yükleniyor…</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={36} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                Keşfet sekmesinden birine mesaj gönder, sohbet burada açılır.
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
            <ChatRow
              otherUid={item.otherUid}
              lastMessage={item.lastMessage}
              lastMessageAt={item.lastMessageAt}
              colors={c}
              onPress={() => router.push(`/chat/${item.otherUid}`)}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

function ChatRow({
  otherUid,
  lastMessage,
  lastMessageAt,
  colors: c,
  onPress,
}: {
  otherUid: string;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  colors: any;
  onPress: () => void;
}) {
  const { user } = useUser(otherUid);
  const photo = user?.photoURL || user?.photos?.[0];
  const name = user?.name || "...";
  const online = user?.online ?? false;

  return (
    <Pressable
      onPress={onPress}
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
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: c.surface }]} />
        )}
        {online && (
          <View style={[styles.dot, { backgroundColor: c.online, borderColor: c.card }]} />
        )}
      </View>
      <View style={styles.middle}>
        <View style={styles.topRow}>
          <VipName name={name} vip={user?.vip} style={{ color: c.text }} fontSize={15} />
          <Text style={[styles.time, { color: c.textMuted }]}>
            {formatChatTime(lastMessageAt)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.msg, { color: c.textMuted }]} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
      </View>
    </Pressable>
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
});
