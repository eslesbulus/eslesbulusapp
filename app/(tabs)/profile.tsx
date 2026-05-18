import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const { user } = useAuth();

  async function handleLogout() {
    Alert.alert("Çıkış", "Çıkış yapmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: () => signOut(auth),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName ?? "Kullanıcı"}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E91E63",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 36, color: "#fff", fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", color: "#333" },
  email: { fontSize: 14, color: "#aaa", marginTop: 4, marginBottom: 40 },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#E91E63",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  logoutText: { color: "#E91E63", fontWeight: "600", fontSize: 16 },
});
