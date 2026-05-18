import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const { user, profile } = useAuth();

  function calcAge(birthDate?: string): string {
    if (!birthDate) return "";
    const parts = birthDate.split(".");
    if (parts.length !== 3) return "";
    const dob = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    const diff = Date.now() - dob.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return isNaN(age) ? "" : `${age} yaşında`;
  }

  async function handleLogout() {
    Alert.alert("Çıkış", "Çıkış yapmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => signOut(auth) },
    ]);
  }

  const age = calcAge(profile?.birthDate);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header gradient with photo */}
        <LinearGradient colors={["#E91E63", "#AD1457"]} style={styles.headerGradient}>
          <View style={styles.photoWrapper}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.photo} />
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoFallbackText}>
                  {profile?.name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>
            {profile?.name ?? user?.displayName ?? "Kullanıcı"}
            {age ? `, ${age}` : ""}
          </Text>
          {profile?.gender && (
            <Text style={styles.gender}>{profile.gender}</Text>
          )}
        </LinearGradient>

        <View style={styles.body}>
          {/* Bio */}
          {profile?.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hakkında</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          ) : null}

          {/* İlgi Alanları */}
          {profile?.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>İlgi Alanları</Text>
              <View style={styles.interestsGrid}>
                {profile.interests.map((item) => (
                  <View key={item} style={styles.interestChip}>
                    <Text style={styles.interestChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Email */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>E-posta</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerGradient: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
    marginBottom: 12,
  },
  photo: { width: "100%", height: "100%" },
  photoFallback: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoFallbackText: { fontSize: 40, color: "#fff", fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  gender: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  body: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  bioText: { fontSize: 15, color: "#444", lineHeight: 22 },
  emailText: { fontSize: 15, color: "#555" },
  interestsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#fce4ec",
  },
  interestChipText: { fontSize: 13, color: "#E91E63", fontWeight: "600" },
  logoutButton: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#ffcdd2",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutText: { color: "#E91E63", fontWeight: "700", fontSize: 15 },
});
