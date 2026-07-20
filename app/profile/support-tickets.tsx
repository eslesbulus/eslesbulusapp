import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMyTickets, type SupportTicketSummary } from "@/hooks/useSupportTickets";
import type { TranslationKeys } from "@/i18n/tr";

function statusLabel(s: SupportTicketSummary["status"], t: (key: TranslationKeys) => string) {
  if (s === "resolved") return { text: t("tickets_status_closed"), color: "#10b981" };
  if (s === "reviewed") return { text: t("tickets_status_answered"), color: "#3b82f6" };
  if (s === "dismissed") return { text: t("common_cancel"), color: "#94a3b8" };
  return { text: t("tickets_status_open"), color: "#f59e0b" };
}

function typeLabelFn(tp: SupportTicketSummary["type"], t: (key: TranslationKeys) => string) {
  const map: Record<string, string> = {
    user: t("tickets_type_report"),
    post: t("tickets_type_report"),
    message: t("tickets_type_report"),
    story: t("tickets_type_report"),
    support: t("tickets_type_support"),
  };
  return map[tp] || tp;
}

function fmtTime(iso: string, t: (key: TranslationKeys) => string, lang: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("time_now");
  if (mins < 60) return `${mins}${t("time_min")}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t("time_hour")}`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}${t("time_days")}`;
  return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "short" });
}

export default function SupportTicketsScreen() {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
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
        <Text style={[styles.title, { color: c.text }]}>{t("tickets_title")}</Text>
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
          <Text style={[styles.emptyTitle, { color: c.text }]}>{t("tickets_empty")}</Text>
          <Text style={[styles.emptySub, { color: c.textMuted }]}>
            {t("tickets_empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item, index }) => {
            const st = statusLabel(item.status, t);
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
                      <Text style={[styles.typeText, { color: c.primary }]}>{typeLabelFn(item.type, t)}</Text>
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
                      {item.lastMessage}
                    </Text>
                  )}

                  <View style={styles.rowBottom}>
                    <Text style={[styles.timeText, { color: c.textMuted }]}>
                      {fmtTime(item.updatedAt, t, lang)}
                    </Text>
                    {item.unread > 0 && (
                      <View style={[styles.unreadPill, { backgroundColor: "#EF4444" }]}>
                        <Text style={styles.unreadText}>{item.unread}</Text>
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
