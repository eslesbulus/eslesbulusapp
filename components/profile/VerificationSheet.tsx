import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/config/api";

type VerificationStatus = "idle" | "pending" | "approved" | "rejected";

type Props = {
  visible: boolean;
  onClose: () => void;
  colors: any;
  currentStatus?: VerificationStatus;
};

export function VerificationSheet({ visible, onClose, colors: c, currentStatus = "idle" }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Selfie çekebilmek için kamera iznine ihtiyacımız var.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }

  async function handleSend() {
    if (!photo) return;
    setSending(true);
    try {
      // Selfie'yi yükle, sonra doğrulama talebi oluştur
      const uploaded = await api.upload("verifications", photo, "image");
      await api.post("/api/users/me/verification", { photo: uploaded.url });
      setSent(true);
    } catch (e: any) {
      Alert.alert("Hata", e?.message ?? "Doğrulama gönderilemedi. Lütfen tekrar dene.");
    }
    setSending(false);
  }

  function handleClose() {
    setPhoto(null);
    setSent(false);
    onClose();
  }

  const isPending = currentStatus === "pending" || sent;
  const isApproved = currentStatus === "approved";
  const isRejected = currentStatus === "rejected";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>
          <Text style={[styles.title, { color: c.text }]}>Hesabı Doğrula</Text>
          {!isPending && !isApproved && photo ? (
            <Pressable
              onPress={handleSend}
              disabled={sending}
              style={[styles.sendBtn, { backgroundColor: c.primary }]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Gönder</Text>
              )}
            </Pressable>
          ) : (
            <View style={{ width: 72 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Durum: Onaylandı */}
          {isApproved && (
            <View style={[styles.statusCard, { backgroundColor: "#16a34a18", borderColor: "#16a34a40" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#16a34a" />
              <Text style={[styles.statusTitle, { color: "#16a34a" }]}>Hesabın Doğrulandı ✓</Text>
              <Text style={[styles.statusSub, { color: c.textMuted }]}>
                Profilinde onaylı rozeti görünüyor. Tebrikler!
              </Text>
            </View>
          )}

          {/* Durum: İnceleniyor */}
          {isPending && !isApproved && (
            <View style={[styles.statusCard, { backgroundColor: `${c.primary}12`, borderColor: `${c.primary}30` }]}>
              <Ionicons name="time-outline" size={40} color={c.primary} />
              <Text style={[styles.statusTitle, { color: c.primary }]}>İnceleniyor…</Text>
              <Text style={[styles.statusSub, { color: c.textMuted }]}>
                Doğrulama fotoğrafın ekibimize iletildi. En geç 24 saat içinde sonuçlanır.
              </Text>
            </View>
          )}

          {/* Durum: Reddedildi */}
          {isRejected && (
            <View style={[styles.statusCard, { backgroundColor: "#dc262618", borderColor: "#dc262640" }]}>
              <Ionicons name="close-circle" size={40} color="#dc2626" />
              <Text style={[styles.statusTitle, { color: "#dc2626" }]}>Doğrulama Reddedildi</Text>
              <Text style={[styles.statusSub, { color: c.textMuted }]}>
                Fotoğraf koşulları sağlanmadı. Lütfen aşağıdaki kurallara dikkat ederek tekrar deneyin.
              </Text>
            </View>
          )}

          {/* Ana içerik — idle veya rejected */}
          {!isPending && !isApproved && (
            <>
              {/* Açıklama */}
              <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.infoTitle, { color: c.text }]}>
                  📋 Doğrulama Nasıl Yapılır?
                </Text>
                <Text style={[styles.infoText, { color: c.textMuted }]}>
                  Hesabının gerçek olduğunu doğrulamak için yüzünü ve elinde tuttuğun bir kağıdı gösteren bir selfie çekmen gerekiyor.
                </Text>
              </View>

              {/* Kurallar */}
              <View style={[styles.rulesCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.rulesTitle, { color: c.text }]}>Kağıda şunları yaz:</Text>
                <View style={[styles.paperExample, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Text style={[styles.paperLine, { color: c.text }]}>Eşleş Buluş</Text>
                  <Text style={[styles.paperDate, { color: c.textMuted }]}>
                    {new Date().toLocaleDateString("tr-TR")}
                  </Text>
                </View>

                {[
                  { icon: "checkmark-circle", color: "#16a34a", text: "Kağıt elde tutulmalı, yüz net görünmeli" },
                  { icon: "checkmark-circle", color: "#16a34a", text: "Yüz maskelenmemiş, gözlük takılabilir" },
                  { icon: "checkmark-circle", color: "#16a34a", text: "İyi aydınlatmalı bir ortamda çekilmeli" },
                  { icon: "close-circle", color: "#dc2626", text: "Filtreli veya düzenlenmiş fotoğraf kabul edilmez" },
                  { icon: "close-circle", color: "#dc2626", text: "Başka bir kişinin fotoğrafı kabul edilmez" },
                ].map((r, i) => (
                  <View key={i} style={styles.ruleRow}>
                    <Ionicons name={r.icon as any} size={16} color={r.color} />
                    <Text style={[styles.ruleText, { color: c.text }]}>{r.text}</Text>
                  </View>
                ))}
              </View>

              {/* Fotoğraf önizleme / çekme */}
              {photo ? (
                <View style={styles.photoWrap}>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                  <Pressable
                    onPress={() => setPhoto(null)}
                    style={[styles.photoRemove, { backgroundColor: c.primary }]}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={handleTakePhoto}
                    style={[styles.retakeBtn, { backgroundColor: c.card, borderColor: c.border }]}
                  >
                    <Ionicons name="camera-reverse-outline" size={16} color={c.primary} />
                    <Text style={[styles.retakeBtnText, { color: c.primary }]}>Yeniden Çek</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={handleTakePhoto}
                  style={[styles.cameraBtn, { backgroundColor: c.primary }]}
                >
                  <Ionicons name="camera" size={26} color="#fff" />
                  <Text style={styles.cameraBtnText}>Selfie Çek</Text>
                </Pressable>
              )}

              <Text style={[styles.privacy, { color: c.textMuted }]}>
                🔒 Fotoğrafın sadece doğrulama amacıyla kullanılır ve ekibimiz tarafından incelendikten sonra silinir.
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  body: { padding: 16, gap: 16, paddingBottom: 40 },

  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  statusTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  statusSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  infoTitle: { fontSize: 15, fontWeight: "700" },
  infoText: { fontSize: 14, lineHeight: 20 },

  rulesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  rulesTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },

  paperExample: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  paperLine: { fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  paperDate: { fontSize: 12, marginTop: 4 },

  ruleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  ruleText: { fontSize: 13, flex: 1, lineHeight: 18 },

  photoWrap: { alignItems: "center", gap: 12 },
  photoPreview: {
    width: "100%",
    height: 340,
    borderRadius: 20,
    resizeMode: "cover",
  },
  photoRemove: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  retakeBtnText: { fontWeight: "600", fontSize: 14 },

  cameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
  },
  cameraBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  privacy: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
