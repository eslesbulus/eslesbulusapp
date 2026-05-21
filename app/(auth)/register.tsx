import { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { VideoView, useVideoPlayer } from "expo-video";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { palette } from "@/constants/theme";
import { firebaseAuthErrorMessage } from "@/constants/firebaseErrors";
import { calculateAge } from "@/lib/age";

const MIN_AGE = 18;
const MAX_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d;
})();
const DEFAULT_PICKER_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d;
})();

function passwordStrength(p: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "#666" };
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
  const score = Math.min(s, 3) as 0 | 1 | 2 | 3;
  const map = [
    { label: "", color: "#666" },
    { label: "Zayıf", color: "#F87171" },
    { label: "Orta", color: "#FBBF24" },
    { label: "Güçlü", color: "#34D399" },
  ];
  return { score, ...map[score] };
}

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsScrollRef = useRef<ScrollView>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const age = useMemo(() => (birthDate ? calculateAge(birthDate) : null), [birthDate]);

  function handleDateChange(event: DateTimePickerEvent, selected?: Date) {
    // Android: dismisses on cancel/set; iOS: stays open until user closes manually
    if (Platform.OS === "android") setPickerOpen(false);
    if (event.type === "set" && selected) {
      setBirthDate(selected);
    }
  }

  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const videoPlayer = useVideoPlayer(
    require("../../public/home/eslesbulus.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  );

  function handleTermsScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 50) {
      setHasScrolledToBottom(true);
    }
  }

  function handleTermsCheckboxPress() {
    if (termsAccepted) {
      setTermsAccepted(false);
    } else {
      setHasScrolledToBottom(false);
      setTermsModalVisible(true);
    }
  }

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Hata", "Tüm alanları doldur.");
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert("Hata", "İsim en az 2 karakter olmalı.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalı.");
      return;
    }
    if (!birthDate || age == null) {
      Alert.alert("Doğum Tarihi", "Doğum tarihini seçmelisin.");
      return;
    }
    if (age < MIN_AGE) {
      Alert.alert("Yaş Doğrulama", `Uygulamayı kullanmak için en az ${MIN_AGE} yaşında olmalısın.`);
      return;
    }
    if (!termsAccepted) {
      Alert.alert("Kullanım Sözleşmesi", "Devam etmek için kullanım sözleşmesini kabul etmelisin.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        photoURL: "",
        birthDate: birthDate.toISOString().slice(0, 10),
        age,
        coins: 500,
        createdAt: serverTimestamp(),
        profileComplete: false,
      });
      // RootNavigator routes to onboarding automatically
    } catch (e: any) {
      Alert.alert("Kayıt başarısız", firebaseAuthErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View entering={FadeInUp.duration(500)} style={styles.logoContainer}>
              <Image
                source={require("../../public/eslesbulustransp.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(500)}>
              <BlurView intensity={28} tint="dark" style={styles.glassCard}>
                <Text style={styles.cardTitle}>Hesap Oluştur</Text>
                <Text style={styles.cardSub}>Birkaç saniye, hemen başlıyoruz</Text>

                {/* Name */}
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.55)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Adın"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    maxLength={40}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.55)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.55)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    placeholder="Şifre (en az 6 karakter)"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    secureTextEntry={!showPwd}
                    autoComplete="password-new"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    onPress={() => setShowPwd((s) => !s)}
                    hitSlop={8}
                    style={styles.pwdToggle}
                  >
                    <Ionicons
                      name={showPwd ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="rgba(255,255,255,0.55)"
                    />
                  </Pressable>
                </View>

                {/* Strength meter */}
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthSeg,
                            {
                              backgroundColor:
                                i <= strength.score
                                  ? strength.color
                                  : "rgba(255,255,255,0.1)",
                            },
                          ]}
                        />
                      ))}
                    </View>
                    {strength.label && (
                      <Text style={[styles.strengthLabel, { color: strength.color }]}>
                        {strength.label}
                      </Text>
                    )}
                  </View>
                )}

                {/* Birth date picker */}
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setPickerOpen(true)}
                  android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                >
                  <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.65)" />
                  <Text
                    style={[
                      styles.dateButtonText,
                      !birthDate && { color: "rgba(255,255,255,0.5)" },
                    ]}
                  >
                    {birthDate
                      ? birthDate.toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Doğum Tarihi Seç"}
                  </Text>
                  {age != null && (
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageBadgeText}>{age} yaş</Text>
                    </View>
                  )}
                </Pressable>

                {/* Terms acceptance */}
                <Pressable
                  style={styles.checkboxRow}
                  onPress={handleTermsCheckboxPress}
                >
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Kullanım sözleşmesini okudum ve{" "}
                    <Text style={styles.checkboxLabelBold}>kabul ediyorum</Text>
                  </Text>
                </Pressable>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Kayıt Ol</Text>
                  )}
                </TouchableOpacity>

                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.loginLink} activeOpacity={0.7}>
                    <Text style={styles.loginLinkText}>
                      Zaten hesabın var mı?{" "}
                      <Text style={styles.loginLinkBold}>Giriş Yap</Text>
                    </Text>
                  </TouchableOpacity>
                </Link>
              </BlurView>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Date picker — Android: inline native; iOS: spinner inside modal */}
      {pickerOpen && Platform.OS === "android" && (
        <DateTimePicker
          value={birthDate ?? DEFAULT_PICKER_DATE}
          mode="date"
          display="default"
          maximumDate={MAX_DATE}
          minimumDate={new Date(1920, 0, 1)}
          onChange={handleDateChange}
        />
      )}
      {Platform.OS === "ios" && (
        <Modal
          visible={pickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerOpen(false)}
        >
          <Pressable style={styles.iosPickerBackdrop} onPress={() => setPickerOpen(false)}>
            <Pressable style={styles.iosPickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.iosPickerHeader}>
                <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
                  <Text style={styles.iosPickerCancel}>İptal</Text>
                </Pressable>
                <Text style={styles.iosPickerTitle}>Doğum Tarihi</Text>
                <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
                  <Text style={styles.iosPickerDone}>Tamam</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={birthDate ?? DEFAULT_PICKER_DATE}
                mode="date"
                display="spinner"
                maximumDate={MAX_DATE}
                minimumDate={new Date(1920, 0, 1)}
                onChange={handleDateChange}
                themeVariant="dark"
                locale="tr-TR"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Terms modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kullanım Sözleşmesi</Text>
            <Pressable onPress={() => setTermsModalVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <ScrollView
            ref={termsScrollRef}
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            onScroll={handleTermsScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            {TERMS_SECTIONS.map((section) => (
              <View key={section.title} style={styles.termsSectionBlock}>
                <Text style={styles.termsSectionTitle}>{section.title}</Text>
                <Text style={styles.termsSectionBody}>{section.body}</Text>
              </View>
            ))}
            <Text style={styles.termsVersion}>
              Son güncelleme: 19 Mayıs 2026 · Sürüm 1.0
            </Text>
            <View style={{ height: 20 }} />
          </ScrollView>

          {!hasScrolledToBottom && (
            <View style={styles.scrollHint}>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.scrollHintText}>Kabul etmek için sona kadar kaydır</Text>
            </View>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                !hasScrolledToBottom && styles.acceptButtonDisabled,
              ]}
              disabled={!hasScrolledToBottom}
              onPress={() => {
                setTermsAccepted(true);
                setTermsModalVisible(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptButtonText}>Okudum ve Kabul Ediyorum</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const TERMS_SECTIONS = [
  {
    title: "1. Hizmetin Kapsamı",
    body: "Eşleşbulus, 18 yaş ve üzeri yetişkinler için geliştirilmiş bir sosyal tanışma platformudur. Uygulamamız, kullanıcıların birbirleriyle tanışmasına ve iletişim kurmasına olanak tanır. Hizmetlerimizden yararlanmak için bu şartları kabul etmeniz zorunludur.",
  },
  {
    title: "2. Kullanıcı Yükümlülükleri",
    body: "Uygulamayı kullanarak aşağıdakileri kabul edersiniz:\n• Gerçek ve doğru bilgiler paylaşmak\n• 18 yaş ve üzeri olmak\n• Diğer kullanıcılara saygılı davranmak\n• Taciz, tehdit veya zararlı içerik paylaşmamak\n• Yasadışı faaliyetlerde bulunmamak",
  },
  {
    title: "3. Yasaklanan İçerikler",
    body: "Aşağıdaki içerikler kesinlikle yasaktır:\n• Cinsel açıdan müstehcen veya şiddet içeren görseller\n• Başkasına ait kişisel bilgilerin izinsiz paylaşılması\n• Sahte hesap veya kimlik oluşturma\n• Spam, reklam veya ticari içerik\n• Nefret söylemi ve ayrımcı paylaşımlar",
  },
  {
    title: "4. Hesap Güvenliği",
    body: "Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayın. Hesabınızda yetkisiz erişim tespit ederseniz derhal destek@eslesbulus.com adresine bildirin. Hizmet ihlali tespit edilmesi durumunda hesabınız uyarı yapılmaksızın askıya alınabilir veya kalıcı olarak kapatılabilir.",
  },
  {
    title: "5. Gizlilik",
    body: "Kişisel verileriniz 6698 sayılı KVKK ve GDPR kapsamında işlenmektedir. Verileriniz yalnızca hizmetin sunulması amacıyla kullanılır ve üçüncü taraflarla satılmaz. Gizlilik Politikamız bu sözleşmenin ayrılmaz bir parçasıdır.",
  },
  {
    title: "6. Hizmet Değişiklikleri",
    body: "Eşleşbulus, önceden bildirimde bulunmaksızın hizmet koşullarını, özelliklerini veya fiyatlandırmasını değiştirme hakkını saklı tutar. Değişiklikler uygulama içi bildirim veya e-posta aracılığıyla duyurulacaktır. Değişikliklerden sonra uygulamayı kullanmaya devam etmek, yeni koşulları kabul ettiğiniz anlamına gelir.",
  },
  {
    title: "7. Sorumluluk Sınırları",
    body: "Eşleşbulus; kullanıcılar arasındaki etkileşimlerden, üçüncü taraf hizmetlerinden veya kullanıcı içeriklerinden kaynaklanan zararlardan sorumlu tutulamaz. Platform, eşleşme garantisi vermez. Tüm kullanıcı etkileşimleri kullanıcıların kendi sorumluluğundadır.",
  },
  {
    title: "8. KVKK Aydınlatma Metni",
    body: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında haklarınız:\n• Kişisel verilerinize erişim hakkı\n• Verilerin düzeltilmesini talep etme hakkı\n• Hesabınızın ve verilerinizin silinmesini isteme hakkı\n• Veri işlemeye itiraz etme hakkı\n• Veri taşınabilirliği hakkı\n\nBu haklarınızı kullanmak için destek@eslesbulus.com adresine başvurabilirsiniz.",
  },
  {
    title: "9. İletişim",
    body: "Bu sözleşme veya uygulamamız hakkında sorularınız için:\n\nE-posta: destek@eslesbulus.com\nAdres: Türkiye\n\nYanıt süresi: 5 iş günü",
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 40,
  },
  logoContainer: { alignItems: "center", marginBottom: 28 },
  logo: { width: 200, height: 80 },

  glassCard: {
    borderRadius: 26,
    overflow: "hidden",
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  cardSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 22,
  },

  inputWrap: {
    position: "relative",
    marginBottom: 12,
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 0,
    bottom: 0,
    textAlignVertical: "center",
    zIndex: 1,
    height: 48,
    lineHeight: 48,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingLeft: 42,
    paddingRight: 14,
    height: 48,
    fontSize: 15,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pwdToggle: {
    position: "absolute",
    right: 12,
    top: 0,
    height: 48,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", width: 44, textAlign: "right" },

  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
    shadowColor: palette.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
  buttonDisabled: { opacity: 0.6 },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 18,
  },
  checkboxLabelBold: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },

  // Date button
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
  },
  ageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: palette.primary,
    borderRadius: 10,
  },
  ageBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },

  // iOS date picker modal
  iosPickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  iosPickerSheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  iosPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  iosPickerCancel: { color: "rgba(255,255,255,0.65)", fontSize: 15 },
  iosPickerDone: { color: palette.primary, fontSize: 15, fontWeight: "700" },
  iosPickerTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },

  loginLink: { marginTop: 18, alignItems: "center" },
  loginLinkText: { color: "rgba(255,255,255,0.65)", fontSize: 14 },
  loginLinkBold: { color: "#fff", fontWeight: "700" },

  // Terms modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  modalScroll: { flex: 1 },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  termsSectionBlock: { marginBottom: 22 },
  termsSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  termsSectionBody: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 20,
  },
  termsVersion: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    marginTop: 8,
  },
  scrollHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  scrollHintText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  acceptButton: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: palette.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  acceptButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowOpacity: 0,
    elevation: 0,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
