import { useState, useCallback, useMemo } from "react";
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
} from "react-native";
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

  const strength = useMemo(() => passwordStrength(password), [password]);

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
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, { displayName: name.trim() });
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        photoURL: "",
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

                <Text style={styles.termsText}>
                  Kayıt olarak{" "}
                  <Text style={styles.termsBold}>Kullanım Koşullarını</Text> ve{" "}
                  <Text style={styles.termsBold}>Gizlilik Politikasını</Text> kabul ediyorsun.
                </Text>

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
    </View>
  );
}

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

  termsText: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },
  termsBold: { color: "rgba(255,255,255,0.75)", fontWeight: "600" },

  loginLink: { marginTop: 18, alignItems: "center" },
  loginLinkText: { color: "rgba(255,255,255,0.65)", fontSize: 14 },
  loginLinkBold: { color: "#fff", fontWeight: "700" },
});
