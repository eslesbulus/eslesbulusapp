import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useTicket, type TicketMessage } from "@/hooks/useSupportTickets";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function statusInfo(s: string | undefined) {
  if (s === "resolved") return { text: "Çözüldü", color: "#10b981" };
  if (s === "reviewed") return { text: "İnceleniyor", color: "#3b82f6" };
  if (s === "dismissed") return { text: "İptal", color: "#94a3b8" };
  return { text: "Yeni", color: "#f59e0b" };
}

export default function SupportTicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ticket, loading, sendMessage } = useTicket(id ?? null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const isClosed = ticket?.status === "resolved" || ticket?.status === "dismissed";

  useEffect(() => {
    if (ticket?.messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [ticket?.messages?.length]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    const t = text.trim();
    setText("");
    setSending(true);
    try {
      await sendMessage(t);
    } catch (e: any) {
      Alert.alert("Hata", e?.message ?? "Mesaj gönderilemedi.");
      setText(t);
    }
    setSending(false);
  }

  const st = statusInfo(ticket?.status);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
            Destek Talebi
          </Text>
          {ticket && (
            <View style={styles.subtitleRow}>
              <View style={[styles.statusDot, { backgroundColor: st.color }]} />
              <Text style={[styles.subtitle, { color: c.textMuted }]}>{st.text}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading || !ticket ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <FlatList
            ref={listRef}
            data={ticket.messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 20 }}
            renderItem={({ item }) => <MessageBubble msg={item} c={c} />}
            ListHeaderComponent={
              <View style={[styles.metaCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.metaTitle, { color: c.textMuted }]}>Konu</Text>
                <Text style={[styles.metaText, { color: c.text }]}>{ticket.reason}</Text>
                <Text style={[styles.metaHint, { color: c.textMuted }]}>
                  Talep tarihi: {new Date(ticket.createdAt).toLocaleString("tr-TR")}
                </Text>
              </View>
            }
          />

          {isClosed ? (
            <View style={[styles.closedBar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: insets.bottom + 12 }]}>
              <Ionicons name="lock-closed-outline" size={16} color={c.textMuted} />
              <Text style={[styles.closedText, { color: c.textMuted }]}>
                Bu talep kapatıldı. Yeni bir sorun için "Sorun Bildir" ekranını kullan.
              </Text>
            </View>
          ) : (
            <View style={[styles.inputBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom + 8 }]}>
              <TextInput
                style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
                placeholder="Mesajını yaz..."
                placeholderTextColor={c.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={1000}
              />
              <Pressable
                onPress={handleSend}
                disabled={!text.trim() || sending}
                style={[styles.sendBtn, { backgroundColor: text.trim() ? c.primary : c.border }]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function MessageBubble({ msg, c }: { msg: TicketMessage; c: any }) {
  const isAdmin = msg.senderRole === "admin";
  return (
    <View style={{ alignItems: isAdmin ? "flex-start" : "flex-end" }}>
      {isAdmin && (
        <View style={styles.adminHeader}>
          <Ionicons name="shield-checkmark" size={12} color={c.primary} />
          <Text style={[styles.adminName, { color: c.primary }]}>Destek Ekibi</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isAdmin
            ? { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderTopLeftRadius: 4 }
            : { backgroundColor: c.primary, borderTopRightRadius: 4 },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isAdmin ? c.text : "#fff" }]}>{msg.text}</Text>
      </View>
      <Text style={[styles.timeText, { color: c.textMuted }]}>{fmtTime(msg.createdAt)}</Text>
    </View>
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
    gap: 8,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: "800" },
  subtitleRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  subtitle: { fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  metaCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 4,
  },
  metaTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  metaText: { fontSize: 14, fontWeight: "600" },
  metaHint: { fontSize: 11, marginTop: 4 },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 14.5, lineHeight: 20 },
  adminHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  adminName: { fontSize: 11, fontWeight: "700" },
  timeText: { fontSize: 10.5, marginTop: 3, marginHorizontal: 6 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  closedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
  },
  closedText: { fontSize: 12.5, flex: 1 },
});
