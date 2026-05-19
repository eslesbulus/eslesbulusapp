import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";

export default function MatchesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Eşleşmeler</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>
          Birbirinizden hoşlandığınızda burada görünür
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
        <View style={[styles.iconWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="heart" size={42} color={c.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: c.text }]}>Henüz eşleşme yok</Text>
        <Text style={[styles.emptySub, { color: c.textMuted }]}>
          Keşfet'ten profillere göz at ve Hi gönder
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
