import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function ProfileScreen() {
  const { user, profile, isDevAdmin, signOut } = useAuth();
  const { theme, mode, toggle } = useTheme();
  const c = theme.colors;

  function calcAge(birthDate?: string): string {
    if (!birthDate) return "";
    const parts = birthDate.split(".");
    if (parts.length !== 3) return "";
    const dob = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    const diff = Date.now() - dob.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return isNaN(age) ? "" : `${age}`;
  }

  function handleLogout() {
    Alert.alert("Çıkış", "Çıkış yapmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => signOut() },
    ]);
  }

  const age = calcAge(profile?.birthDate);
  const displayName = profile?.name ?? user?.displayName ?? "Kullanıcı";
  const photo = profile?.photoURL;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <LinearGradient
          colors={[c.primary, c.primaryDark]}
          style={styles.headerGradient}
        >
          <View style={styles.headerActions}>
            <Pressable onPress={toggle} style={styles.headerBtn} hitSlop={8}>
              <Ionicons
                name={mode === "dark" ? "sunny-outline" : "moon-outline"}
                size={20}
                color="#fff"
              />
            </Pressable>
            <Pressable style={styles.headerBtn} hitSlop={8}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.photoWrapper}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoFallbackText}>
                  {displayName[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>
            {displayName}
            {age ? `, ${age}` : ""}
          </Text>
          {isDevAdmin && (
            <View style={styles.devBadge}>
              <Ionicons name="code-slash" size={11} color="#fff" />
              <Text style={styles.devBadgeText}>DEV ADMIN</Text>
            </View>
          )}
          {profile?.gender && !isDevAdmin && (
            <Text style={styles.gender}>{profile.gender}</Text>
          )}
        </LinearGradient>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.body}>
          {profile?.bio ? (
            <Section title="Hakkında" c={c}>
              <Text style={[styles.bioText, { color: c.text }]}>{profile.bio}</Text>
            </Section>
          ) : null}

          {profile?.interests && profile.interests.length > 0 && (
            <Section title="İlgi Alanları" c={c}>
              <View style={styles.interestsGrid}>
                {profile.interests.map((item) => (
                  <View
                    key={item}
                    style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}
                  >
                    <Text style={[styles.chipText, { color: c.primary }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          <Section title="Hesap" c={c}>
            <Row icon="mail-outline" label="E-posta" value={user?.email ?? "—"} c={c} />
            <Row
              icon="diamond-outline"
              label="Üyelik"
              value={profile?.profileComplete ? "Standart" : "Tamamlanmamış"}
              c={c}
            />
          </Section>

          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: c.primary }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={c.primary} />
            <Text style={[styles.logoutText, { color: c.primary }]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, c, children }: { title: string; c: any; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: c.card, borderColor: c.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  c,
}: {
  icon: any;
  label: string;
  value: string;
  c: any;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={c.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerGradient: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerActions: {
    position: "absolute",
    top: 12,
    right: 16,
    flexDirection: "row",
    gap: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
    marginBottom: 12,
    marginTop: 16,
  },
  photo: { width: "100%", height: "100%" },
  photoFallback: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoFallbackText: { fontSize: 40, color: "#fff", fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "800", color: "#fff" },
  gender: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  devBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  devBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  body: { padding: 16, paddingTop: 20 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionBody: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  bioText: { fontSize: 15, lineHeight: 22 },
  interestsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  rowLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  rowValue: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  logoutButton: {
    marginTop: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { fontWeight: "700", fontSize: 15 },
});
