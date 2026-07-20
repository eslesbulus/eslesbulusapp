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
  Pressable,
  Modal,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import type { TranslationKeys } from "@/i18n/tr";
import { palette } from "@/constants/theme";
import { firebaseAuthErrorMessage } from "@/constants/firebaseErrors";
import { GOOGLE_WEB_CLIENT_ID } from "@/constants/googleAuth";

let GoogleSignin: any = null;
let gStatusCodes: any = {};
try {
  const mod = require("@react-native-google-signin/google-signin");
  GoogleSignin = mod.GoogleSignin;
  gStatusCodes = mod.statusCodes;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
} catch {}

const DEV_ADMIN_EMAIL = "admin";
const DEV_ADMIN_PASSWORD = "admin";

export default function LoginScreen() {
  const { signInAsDevAdmin } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const LEGAL_ITEMS = getLegalItems(t);
  const [openLegal, setOpenLegal] = useState<(typeof LEGAL_ITEMS)[number] | null>(null);
  const insets = useSafeAreaInsets();

  async function handleGoogleSignIn() {
    if (!GoogleSignin) {
      showAlert(t("auth_google"), t("auth_google_expo"));
      return;
    }
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) throw new Error(t("auth_id_token_error"));

      const credential = GoogleAuthProvider.credential(idToken);
      const { user } = await signInWithCredential(auth, credential);

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName ?? "",
          email: user.email ?? "",
          photoURL: user.photoURL ?? "",
          createdAt: serverTimestamp(),
          profileComplete: false,
        });
      }
    } catch (e: any) {
      if (e.code === gStatusCodes.SIGN_IN_CANCELLED) return;
      if (e.code === gStatusCodes.IN_PROGRESS) return;
      showAlert(t("auth_google_failed"), e.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmailLogin() {
    if (!email.trim() || !password) {
      showAlert(t("auth_error"), t("auth_email_password_required"));
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
    } catch (e: any) {
      showAlert(t("auth_login_failed"), firebaseAuthErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      showAlert(t("auth_forgot_email_required_title"), t("auth_forgot_email_required"));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showAlert(t("auth_reset_sent"), t("auth_reset_sent_desc", { email: email.trim() }));
    } catch (e: any) {
      showAlert(t("auth_error"), firebaseAuthErrorMessage(e.code));
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
              <View style={styles.glassCard}>
                <Text style={styles.cardTitle}>{t("auth_welcome")}</Text>
                <Text style={styles.cardSub}>{t("auth_welcome_sub")}</Text>

                {/* Email */}
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.55)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("auth_email")}
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
                    placeholder={t("auth_password")}
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    secureTextEntry={!showPwd}
                    autoComplete="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    textContentType="password"
                    importantForAutofill="yes"
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
                  <Text style={styles.forgotText}>{t("auth_forgot")}</Text>
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
                    <Text style={styles.primaryButtonText}>{t("auth_login")}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t("auth_or")}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading}
                  activeOpacity={0.85}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#333" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={18} color="#4285F4" />
                      <Text style={styles.googleButtonText}>{t("auth_google")}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity style={styles.registerLink} activeOpacity={0.7}>
                    <Text style={styles.registerLinkText}>
                      {t("auth_no_account")}{" "}
                      <Text style={styles.registerLinkBold}>{t("auth_register")}</Text>
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>

          </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed legal footer */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(500)}
        style={[styles.legalFooter, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="box-none"
      >
        <Text style={styles.legalNotice}>
          {t("auth_legal_notice")}
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

function getLegalItems(t: (key: TranslationKeys, params?: Record<string, string | number>) => string) {
  return [
    {
      key: "terms",
      title: t("legal_terms"),
      body: "Eşleşbulus, 18 yaş ve üzeri kullanıcılara yönelik bir sosyal tanışma platformudur. Uygulamayı kullanarak yasalara uygun davranmayı, diğer kullanıcılara saygılı olmayı ve sahte bilgi paylaşmamayı kabul edersiniz. Hizmet ihlali durumunda hesabınız uyarısız askıya alınabilir veya kalıcı olarak kapatılabilir.",
    },
    {
      key: "privacy",
      title: t("legal_privacy"),
      body: "Adınız, e-posta adresiniz, profil fotoğrafınız ve şehir bilginiz güvenli sunucularımızda şifreli olarak saklanır. Verileriniz hiçbir koşulda üçüncü taraflarla satılmaz veya paylaşılmaz. Dilediğiniz zaman hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz. Detaylar için destek@eslesbulus.com adresine başvurabilirsiniz.",
    },
    {
      key: "kvkk",
      title: t("legal_kvkk"),
      body: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Veri sorumlusu olarak Eşleşbulus, verilerinizi yalnızca hizmetin sunulması amacıyla işlemektedir. İlgili talepleriniz için destek@eslesbulus.com adresine e-posta gönderebilirsiniz.",
    },
  ];
}

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
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.62)",
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

  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 13,
  },
  googleButtonText: { fontSize: 15, fontWeight: "600", color: "#333" },

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
