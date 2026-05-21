import { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { palette } from "@/constants/theme";
import { firebaseAuthErrorMessage } from "@/constants/firebaseErrors";

const DEV_ADMIN_EMAIL = "admin";
const DEV_ADMIN_PASSWORD = "admin";

export default function LoginScreen() {
  const { signInAsDevAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [openLegal, setOpenLegal] = useState<(typeof LEGAL_ITEMS)[number] | null>(null);
  const insets = useSafeAreaInsets();

  async function handleEmailLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Hata", "E-posta ve şifre boş bırakılamaz.");
      return;
    }
    setLoading(true);

    // DEV bypass
    if (email.trim().toLowerCase() === DEV_ADMIN_EMAIL && password.trim() === DEV_ADMIN_PASSWORD) {
      signInAsDevAdmin();
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Routing handled by AuthContext + RootNavigator
    } catch (e: any) {
      Alert.alert("Giriş başarısız", firebaseAuthErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert("E-posta gerekli", "Şifreni sıfırlamak için önce e-postanı yaz.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Sıfırlama bağlantısı gönderildi",
        `${email.trim()} adresine şifre sıfırlama linki gönderdik.`
      );
    } catch (e: any) {
      Alert.alert("Hata", firebaseAuthErrorMessage(e.code));
    }
  }

  return (
    <View style={styles.container}>
      {/* Video + gradient handled by (auth)/_layout.tsx */}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.scroll}
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
                <Text style={styles.cardTitle}>Hoş Geldin</Text>
                <Text style={styles.cardSub}>Giriş yap, eşleşmen başlasın</Text>

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
                    placeholder="Şifre"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    secureTextEntry={!showPwd}
                    autoComplete="password"
                    autoCapitalize="none"
                    autoCorrect={false}
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

                <Pressable onPress={handleForgotPassword} style={styles.forgotWrap}>
                  <Text style={styles.forgotText}>Şifremi unuttum</Text>
                </Pressable>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleEmailLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Giriş Yap</Text>
                  )}
                </TouchableOpacity>

                {/* Divider for future Google */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ya da</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.googleDisabledWrap}>
                  <Ionicons name="logo-google" size={18} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.googleDisabledText}>
                    Google ile giriş — yakında
                  </Text>
                </View>

                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity style={styles.registerLink} activeOpacity={0.7}>
                    <Text style={styles.registerLinkText}>
                      Hesabın yok mu?{" "}
                      <Text style={styles.registerLinkBold}>Kayıt Ol</Text>
                    </Text>
                  </TouchableOpacity>
                </Link>
              </BlurView>
            </Animated.View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Fixed legal footer */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(500)}
        style={[styles.legalFooter, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="box-none"
      >
        <Text style={styles.legalNotice}>
          Uygulamayı kullanarak gizlilik politikamızı ve kullanıcı sözleşmemizi kabul etmiş olursunuz.
        </Text>
        <View style={styles.legalLinks}>
          {LEGAL_ITEMS.map((item, i) => (
            <View key={item.key} style={styles.legalLinkRow}>
              {i > 0 && <Text style={styles.legalDot}>·</Text>}
              <Pressable onPress={() => setOpenLegal(item)} hitSlop={6}>
                <Text style={styles.legalLinkText}>{item.title}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Legal detail modal */}
      <Modal
        visible={openLegal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setOpenLegal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpenLegal(null)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>{openLegal?.title}</Text>
              <Pressable onPress={() => setOpenLegal(null)} hitSlop={12}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
            <Text style={styles.modalSheetBody}>{openLegal?.body}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const LEGAL_ITEMS = [
  {
    key: "terms",
    title: "Kullanım Şartları",
    body: "Eşleşbulus, 18 yaş ve üzeri kullanıcılara yönelik bir sosyal tanışma platformudur. Uygulamayı kullanarak yasalara uygun davranmayı, diğer kullanıcılara saygılı olmayı ve sahte bilgi paylaşmamayı kabul edersiniz. Hizmet ihlali durumunda hesabınız uyarısız askıya alınabilir veya kalıcı olarak kapatılabilir.",
  },
  {
    key: "privacy",
    title: "Gizlilik Sözleşmesi",
    body: "Adınız, e-posta adresiniz, profil fotoğrafınız ve şehir bilginiz güvenli sunucularımızda şifreli olarak saklanır. Verileriniz hiçbir koşulda üçüncü taraflarla satılmaz veya paylaşılmaz. Dilediğiniz zaman hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz. Detaylar için destek@eslesbulus.com adresine başvurabilirsiniz.",
  },
  {
    key: "kvkk",
    title: "KVKK",
    body: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Veri sorumlusu olarak Eşleşbulus, verilerinizi yalnızca hizmetin sunulması amacıyla işlemektedir. İlgili talepleriniz için destek@eslesbulus.com adresine e-posta gönderebilirsiniz.",
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  keyboardView: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingBottom: 90,
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

  forgotWrap: { alignSelf: "flex-end", marginTop: 2, marginBottom: 14 },
  forgotText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12.5,
    fontWeight: "500",
  },

  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 2,
    shadowColor: palette.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
  buttonDisabled: { opacity: 0.6 },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  dividerText: { color: "rgba(255,255,255,0.45)", fontSize: 12 },

  googleDisabledWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  googleDisabledText: { fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: "500" },

  registerLink: { marginTop: 18, alignItems: "center" },
  registerLinkText: { color: "rgba(255,255,255,0.65)", fontSize: 14 },
  registerLinkBold: { color: "#fff", fontWeight: "700" },

  legalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  legalNotice: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.38)",
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 8,
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  legalLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legalDot: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
  },
  legalLinkText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    textDecorationLine: "underline",
    textDecorationColor: "rgba(255,255,255,0.25)",
  },

  // Legal modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalSheetBody: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 21,
  },
});
