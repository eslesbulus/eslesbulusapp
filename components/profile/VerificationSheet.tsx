import { useRef, useState } from "react";
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
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

type VerificationStatus = "idle" | "pending" | "approved" | "rejected";

type Props = {
  visible: boolean;
  onClose: () => void;
  colors: any;
  currentStatus?: VerificationStatus;
};

export function VerificationSheet({ visible, onClose, colors: c, currentStatus = "idle" }: Props) {
  const { refreshProfile } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  async function handleTakePhoto() {
    // İzin yoksa iste; reddedildiyse uyar
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        Alert.alert("İzin Gerekli", "Selfie çekebilmek için kamera iznine ihtiyacımız var.");
        return;
      }
    }
    setCameraOpen(true);
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (pic?.uri) {
        setPhoto(pic.uri);
        setCameraOpen(false);
      }
    } catch (e: any) {
      Alert.alert("Hata", e?.message ?? "Fotoğraf çekilemedi.");
    }
    setCapturing(false);
  }

  async function handleSend() {
    if (!photo) return;
    setSending(true);
    try {
      // Selfie'yi yükle, sonra doğrulama talebi oluştur
      const uploaded = await api.upload("verifications", photo, "image");
      await api.post("/api/users/me/verification", { photo: uploaded.url });
      setSent(true);
      // Profil ekranındaki alt-satır (İnceleniyor…) hemen güncellensin
      refreshProfile().catch(() => {});
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

      {/* Ön kamera — flip butonu yok, kullanıcı arka kameraya geçemez */}
      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={() => setCameraOpen(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.cameraView}
            facing="front"
          />
          {/* Üst bar — kapat */}
          <View style={styles.cameraTopBar}>
            <Pressable onPress={() => setCameraOpen(false)} hitSlop={12} style={styles.cameraTopBtn}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
            <View style={styles.cameraHintPill}>
              <Ionicons name="camera-reverse-outline" size={13} color="#fff" />
              <Text style={styles.cameraHintText}>Ön Kamera</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          {/* Alt bar — çekim düğmesi */}
          <View style={styles.cameraBottomBar}>
            <Text style={styles.cameraHelp}>Yüzünü ve elindeki kağıdı net göster</Text>
            <Pressable
              onPress={handleCapture}
              disabled={capturing}
              style={[styles.captureBtn, capturing && { opacity: 0.6 }]}
            >
              <View style={styles.captureInner} />
            </Pressable>
          </View>
        </View>
      </Modal>
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

  // Ön kamera modalı
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  cameraView: { flex: 1 },
  cameraTopBar: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraHintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cameraHintText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cameraBottomBar: {
    position: "absolute",
    bottom: 46,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
  },
  cameraHelp: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  captureBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
});
