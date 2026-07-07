import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useMyTickets, type SupportTicketSummary } from "@/hooks/useSupportTickets";

function statusLabel(s: SupportTicketSummary["status"]) {
  if (s === "resolved") return { text: "Çözüldü", color: "#10b981" };
  if (s === "reviewed") return { text: "İnceleniyor", color: "#3b82f6" };
  if (s === "dismissed") return { text: "İptal", color: "#94a3b8" };
  return { text: "Yeni", color: "#f59e0b" };
}

function typeLabel(t: SupportTicketSummary["type"]) {
  return { user: "Kullanıcı Şikayeti", post: "Gönderi Şikayeti", message: "Mesaj Şikayeti", story: "Hikaye Şikayeti", support: "Destek Talebi" }[t] || t;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins}dk`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}g`;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export default function SupportTicketsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { tickets, loading, refresh } = useMyTickets();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Taleplerim</Text>
        <Pressable onPress={refresh} hitSlop={12}>
          <Ionicons name="refresh" size={20} color={c.textMuted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={44} color={c.textMuted} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>Henüz talep yok</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>
            Sorun bildir veya şikayet ettiğinde burada görürsün.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item, index }) => {
            const st = statusLabel(item.status);
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
                <Pressable
                  onPress={() => router.push(`/profile/support-ticket/${item.id}`)}
                  style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.rowTop}>
                    <View style={styles.typeBadge}>
                      <Ionicons
                        name={item.type === "support" ? "help-circle-outline" : "flag-outline"}
                        size={12}
                        color={c.primary}
                      />
                      <Text style={[styles.typeText, { color: c.primary }]}>{typeLabel(item.type)}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: `${st.color}20` }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.text}</Text>
                    </View>
                  </View>

                  <Text style={[styles.subject, { color: c.text }]} numberOfLines={2}>
                    {item.details || item.reason || "-"}
                  </Text>

                  {item.messageCount > 1 && (
                    <Text style={[styles.lastMsg, { color: c.textMuted }]} numberOfLines={1}>
                      Son: {item.lastMessage}
                    </Text>
                  )}

                  <View style={styles.rowBottom}>
                    <Text style={[styles.timeText, { color: c.textMuted }]}>
                      {fmtTime(item.updatedAt)}
                    </Text>
                    {item.unread > 0 && (
                      <View style={[styles.unreadPill, { backgroundColor: "#EF4444" }]}>
                        <Text style={styles.unreadText}>{item.unread} yeni</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  typeText: { fontSize: 11, fontWeight: "700" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "700" },
  subject: { fontSize: 14.5, fontWeight: "600", lineHeight: 19 },
  lastMsg: { fontSize: 12.5 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  timeText: { fontSize: 11.5 },
  unreadPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
