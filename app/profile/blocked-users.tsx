import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert } from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useBlockedUsers } from "@/context/BlockedUsersContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function BlockedUsersScreen() {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const c = theme.colors;
  const router = useRouter();

  function handleUnblock(id: string, name: string) {
    showAlert(
      t("blocked_unblock"),
      t("blocked_unblock_confirm", { name }),
      [
        { text: t("common_cancel"), style: "cancel" },
        {
          text: t("blocked_unblock"),
          onPress: () => unblockUser(id),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t("blocked_title")}</Text>
        <View style={{ width: 36 }} />
      </View>

      {blockedUsers.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="shield-checkmark-outline" size={36} color={c.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>{t("blocked_empty")}</Text>
          <Text style={[styles.emptyDesc, { color: c.textMuted }]}>
            {t("blocked_empty")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {blockedUsers.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
              style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <Image source={{ uri: item.photo }} style={styles.avatar} />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: c.text }]}>{item.name}</Text>
                <Text style={[styles.cardDate, { color: c.textMuted }]}>
                  {new Date(item.blockedAt).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                </Text>
              </View>
              <Pressable
                onPress={() => handleUnblock(item.id, item.name)}
                style={[styles.unblockBtn, { borderColor: c.primary }]}
              >
                <Text style={[styles.unblockBtnText, { color: c.primary }]}>{t("blocked_unblock")}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: "700" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700" },
  cardDate: { fontSize: 12, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  unblockBtnText: { fontSize: 13, fontWeight: "700" },
});
