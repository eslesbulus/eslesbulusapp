import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";

export default function PostsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Gönderi</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Anını paylaş, ilgi çek</Text>
      </View>

      <Animated.View entering={FadeInUp.duration(400)} style={styles.body}>
        <LinearGradient
          colors={[c.primary, c.primaryDark]}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="camera" size={32} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>İlk gönderini paylaş</Text>
          <Text style={styles.cardSub}>
            Fotoğraf, hikaye veya kısa video — profili canlı tut
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Ionicons name="add" size={18} color={c.primary} />
            <Text style={[styles.ctaText, { color: c.primary }]}>Yeni Gönderi</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.tipsRow}>
          <Tip icon="image-outline" label="Fotoğraf" c={c} />
          <Tip icon="videocam-outline" label="Video" c={c} />
          <Tip icon="time-outline" label="Hikaye" c={c} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function Tip({ icon, label, c }: { icon: any; label: string; c: any }) {
  return (
    <View style={[styles.tip, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Ionicons name={icon} size={22} color={c.textMuted} />
      <Text style={[styles.tipText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 4 },
  body: { flex: 1, paddingHorizontal: 16 },
  card: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  cardSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  cta: {
    marginTop: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaText: { fontWeight: "800", fontSize: 14 },
  tipsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  tip: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tipText: { fontSize: 13, fontWeight: "600" },
});
