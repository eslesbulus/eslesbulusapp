import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Switch,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useBlockedUsers } from "@/context/BlockedUsersContext";

export default function ProfileScreen() {
  const { user, profile, isDevAdmin, signOut } = useAuth();
  const { theme, mode, toggle } = useTheme();
  const { blockedUsers } = useBlockedUsers();
  const router = useRouter();
  const c = theme.colors;

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  const [reportSending, setReportSending] = useState(false);

  function calcAge(birthDate?: string): string {
    if (!birthDate) return "";
    const parts = birthDate.split(".");
    if (parts.length !== 3) return "";
    const dob = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return isNaN(age) ? "" : `${age}`;
  }

  async function handleReportPickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraflara erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReportPhoto(result.assets[0].uri);
    }
  }

  async function handleReportSend() {
    if (!reportText.trim()) {
      Alert.alert("Hata", "Lütfen sorunu açıkla.");
      return;
    }
    setReportSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setReportSending(false);
    setReportModalOpen(false);
    setReportText("");
    setReportPhoto(null);
    Alert.alert("Teşekkürler", "Sorun bildiriminiz alındı, en kısa sürede inceleyeceğiz.");
  }

  function handleLogout() {
    Alert.alert("Çıkış Yap", "Hesabından çıkış yapmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => signOut() },
    ]);
  }

  const age = calcAge(profile?.birthDate);
  const displayName = profile?.name ?? user?.displayName ?? "Kullanıcı";
  const photo = profile?.photoURL;
  const extraPhotos = profile?.photos ?? [];
  const photoCount = (photo ? 1 : 0) + extraPhotos.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 110 : 90 }}
      >
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={[c.primary, c.primaryDark]}
          style={styles.hero}
        >
          {/* Avatar */}
          <Pressable onPress={() => router.push("/profile/edit")} style={styles.avatarWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase() ?? "?"}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>

          <Text style={styles.heroName}>
            {displayName}
            {age ? `, ${age}` : ""}
          </Text>

          {profile?.city ? (
            <View style={styles.heroCityRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroCity}>{profile.city}</Text>
            </View>
          ) : null}

          {isDevAdmin && (
            <View style={styles.devBadge}>
              <Ionicons name="code-slash" size={11} color="#fff" />
              <Text style={styles.devBadgeText}>DEV ADMIN</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatItem label="Fotoğraf" value={String(photoCount)} />
            <View style={styles.statDivider} />
            <StatItem label="İlgi Alanı" value={String(profile?.interests?.length ?? 0)} />
            <View style={styles.statDivider} />
            <StatItem
              label="Üyelik"
              value={profile?.profileComplete ? "Standart" : "Eksik"}
            />
          </View>
        </LinearGradient>

        {/* ── Profili Düzenle Butonu ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.editBtnWrap}>
          <Pressable
            onPress={() => router.push("/profile/edit")}
            style={[styles.editBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Ionicons name="create-outline" size={18} color={c.primary} />
            <Text style={[styles.editBtnText, { color: c.primary }]}>Profili Düzenle</Text>
          </Pressable>
        </Animated.View>

        {/* ── Bio ── */}
        {profile?.bio ? (
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={[styles.bioCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.bioText, { color: c.text }]}>{profile.bio}</Text>
          </Animated.View>
        ) : null}

        {/* ── Hesap Ayarları ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)}>
          <SectionHeader title="Hesap" c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <RowItem
              icon="mail-outline"
              label="E-posta"
              value={user?.email ?? "—"}
              c={c}
            />
            <Divider c={c} />
            <RowItem
              icon="diamond-outline"
              label="Üyelik Planı"
              value="Standart"
              c={c}
            />
          </View>
        </Animated.View>

        {/* ── Görünüm ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)}>
          <SectionHeader title="Görünüm" c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.rowItem}>
              <View style={[styles.rowIcon, { backgroundColor: `${c.primary}18` }]}>
                <Ionicons name="moon-outline" size={18} color={c.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: c.text }]}>Karanlık Mod</Text>
              <Switch
                value={mode === "dark"}
                onValueChange={toggle}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </Animated.View>

        {/* ── Gizlilik ve Güvenlik ── */}
        <Animated.View entering={FadeInDown.delay(220).duration(350)}>
          <SectionHeader title="Gizlilik ve Güvenlik" c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <NavRow
              icon="shield-checkmark-outline"
              label="Gizlilik Politikası"
              onPress={() => router.push("/profile/privacy-policy")}
              c={c}
            />
            <Divider c={c} />
            <NavRow
              icon="ban-outline"
              label="Engellenen Kullanıcılar"
              badge={blockedUsers.length > 0 ? String(blockedUsers.length) : undefined}
              onPress={() => router.push("/profile/blocked-users")}
              c={c}
            />
          </View>
        </Animated.View>

        {/* ── Destek ── */}
        <Animated.View entering={FadeInDown.delay(260).duration(350)}>
          <SectionHeader title="Destek" c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <NavRow
              icon="help-circle-outline"
              label="Yardım Merkezi"
              onPress={() => Alert.alert("Yardım", "destek@eslesbulus.com")}
              c={c}
            />
            <Divider c={c} />
            <NavRow
              icon="flag-outline"
              label="Sorun Bildir"
              onPress={() => setReportModalOpen(true)}
              c={c}
            />
            <Divider c={c} />
            <NavRow
              icon="information-circle-outline"
              label="Uygulama Hakkında"
              value="v1.0.0"
              onPress={() => {}}
              c={c}
            />
          </View>
        </Animated.View>

        {/* ── Sorun Bildir Modal ── */}
        <Modal
          visible={reportModalOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setReportModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.reportModal, { backgroundColor: c.background }]}>
              {/* Modal Header */}
              <View style={[styles.reportHeader, { borderBottomColor: c.border }]}>
                <Pressable
                  onPress={() => setReportModalOpen(false)}
                  hitSlop={12}
                  style={styles.reportClose}
                >
                  <Ionicons name="close" size={24} color={c.text} />
                </Pressable>
                <Text style={[styles.reportTitle, { color: c.text }]}>Sorun Bildir</Text>
                <Pressable
                  onPress={handleReportSend}
                  disabled={reportSending || !reportText.trim()}
                  style={[
                    styles.reportSendBtn,
                    { backgroundColor: reportText.trim() ? c.primary : c.border },
                  ]}
                >
                  {reportSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.reportSendText}>Gönder</Text>
                  )}
                </Pressable>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.reportLabel, { color: c.textMuted }]}>
                  Sorununu açıkla (max 500 karakter)
                </Text>
                <TextInput
                  value={reportText}
                  onChangeText={(t) => setReportText(t.slice(0, 500))}
                  placeholder="Uygulamada karşılaştığın sorunu anlat..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  numberOfLines={6}
                  style={[
                    styles.reportInput,
                    { backgroundColor: c.surface, color: c.text, borderColor: c.border },
                  ]}
                />
                <Text style={[styles.reportCharCount, { color: c.textMuted }]}>
                  {reportText.length}/500
                </Text>

                <Text style={[styles.reportLabel, { color: c.textMuted, marginTop: 20 }]}>
                  Ekran görüntüsü (isteğe bağlı)
                </Text>
                {reportPhoto ? (
                  <View style={styles.reportPhotoWrap}>
                    <Image source={{ uri: reportPhoto }} style={styles.reportPhotoPreview} />
                    <Pressable
                      onPress={() => setReportPhoto(null)}
                      style={[styles.reportPhotoRemove, { backgroundColor: c.primary }]}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={handleReportPickPhoto}
                    style={[
                      styles.reportPhotoBtn,
                      { backgroundColor: c.surface, borderColor: c.border },
                    ]}
                  >
                    <Ionicons name="image-outline" size={28} color={c.primary} />
                    <Text style={[styles.reportPhotoBtnText, { color: c.primary }]}>
                      Fotoğraf Ekle
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ── Çıkış ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(350)} style={styles.logoutWrap}>
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { borderColor: "#E53935" }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#E53935" />
            <Text style={[styles.logoutText, { color: "#E53935" }]}>Çıkış Yap</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, c }: { title: string; c: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: c.textMuted }]}>{title}</Text>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Divider({ c }: { c: any }) {
  return <View style={[styles.divider, { backgroundColor: c.border }]} />;
}

function RowItem({ icon, label, value, c }: { icon: any; label: string; value: string; c: any }) {
  return (
    <View style={styles.rowItem}>
      <View style={[styles.rowIcon, { backgroundColor: `${c.primary}18` }]}>
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: c.textMuted }]}>{value}</Text>
      </View>
    </View>
  );
}

function NavRow({
  icon,
  label,
  value,
  badge,
  onPress,
  c,
}: {
  icon: any;
  label: string;
  value?: string;
  badge?: string;
  onPress: () => void;
  c: any;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.6 }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${c.primary}18` }]}>
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: c.text, flex: 1 }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: c.textMuted }]}>{value}</Text> : null}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  hero: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroActions: {
    position: "absolute",
    top: 12,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  heroBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarWrap: { position: "relative", marginTop: 16, marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "rgba(255,255,255,0.8)" },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 40, color: "#fff", fontWeight: "bold" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  heroName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroCityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  heroCity: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
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

  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    width: "100%",
    paddingHorizontal: 24,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },

  editBtnWrap: { paddingHorizontal: 16, marginTop: 16 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  editBtnText: { fontWeight: "700", fontSize: 15 },

  bioCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bioText: { fontSize: 15, lineHeight: 22 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },

  group: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { height: 1, marginLeft: 56 },

  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowValue: { fontSize: 13 },

  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  reportModal: { flex: 1 },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  reportClose: { padding: 4 },
  reportTitle: { fontSize: 17, fontWeight: "700" },
  reportSendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
  },
  reportSendText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reportLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  reportInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    textAlignVertical: "top",
    minHeight: 130,
  },
  reportCharCount: { fontSize: 11, textAlign: "right", marginTop: 4 },
  reportPhotoWrap: { position: "relative", alignSelf: "flex-start" },
  reportPhotoPreview: { width: 120, height: 120, borderRadius: 14 },
  reportPhotoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  reportPhotoBtn: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reportPhotoBtnText: { fontWeight: "700", fontSize: 14 },

  logoutWrap: { paddingHorizontal: 16, marginTop: 24 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
});
