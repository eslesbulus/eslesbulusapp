import { useState, useCallback } from "react";
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
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect } from "expo-router";
// TODO: Google Sign-In — native module, Expo Go'da çalışmaz. APK build'de aktif et.
// import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
// import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
// import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
// import { auth, db } from "@/config/firebase";
// import { GOOGLE_WEB_CLIENT_ID } from "@/constants/googleAuth";
import { useAuth } from "@/context/AuthContext";

// DEV admin bypass — Firebase'i atlar, sadece test için
const DEV_ADMIN_EMAIL = "admin";
const DEV_ADMIN_PASSWORD = "admin";

// GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

export default function LoginScreen() {
  const { signInAsDevAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false); // TODO: Google Sign-In

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

  // TODO: Google Sign-In — APK build'de aktif et
  // async function handleGoogleSignIn() {
  //   setGoogleLoading(true);
  //   try {
  //     await GoogleSignin.hasPlayServices();
  //     const userInfo = await GoogleSignin.signIn();
  //     const idToken = userInfo.data?.idToken;
  //     if (!idToken) throw new Error("ID token alınamadı.");
  //     const credential = GoogleAuthProvider.credential(idToken);
  //     const { user } = await signInWithCredential(auth, credential);
  //     const userRef = doc(db, "users", user.uid);
  //     const snap = await getDoc(userRef);
  //     if (!snap.exists()) {
  //       await setDoc(userRef, {
  //         uid: user.uid,
  //         name: user.displayName ?? "",
  //         email: user.email ?? "",
  //         photoURL: user.photoURL ?? "",
  //         createdAt: serverTimestamp(),
  //         profileComplete: false,
  //       });
  //     }
  //   } catch (e: any) {
  //     if (e.code === statusCodes.SIGN_IN_CANCELLED) return;
  //     if (e.code === statusCodes.IN_PROGRESS) return;
  //     Alert.alert("Google ile giriş başarısız", e.message);
  //   } finally {
  //     setGoogleLoading(false);
  //   }
  // }

  async function handleEmailLogin() {
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre boş bırakılamaz.");
      return;
    }
    setLoading(true);
    if (email.trim() === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
      signInAsDevAdmin();
      setLoading(false);
      return;
    }
    setLoading(false);
    Alert.alert(
      "Giriş başarısız",
      "Email/şifre girişi kapalı. Google ile giriş yap veya test için admin/admin kullan."
    );
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
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
        style={StyleSheet.absoluteFill}
      />

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
            <View style={styles.logoContainer}>
              <Image
                source={require("../../public/eslesbulustransp.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <BlurView intensity={25} tint="dark" style={styles.glassCard}>
          <Text style={styles.cardTitle}>Hoş Geldin</Text>

          {/* TODO: Google Sign-In — APK build'de aktif et
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#333" />
            ) : (
              <>
                <Text style={styles.googleIconText}>G</Text>
                <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>
          */}

          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.registerLink}>
              <Text style={styles.registerLinkText}>
                Hesabın yok mu?{" "}
                <Text style={styles.registerLinkBold}>Kayıt Ol</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </BlurView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  keyboardView: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 80,
  },
  logoContainer: { alignItems: "center", marginBottom: 32 },
  logo: { width: 200, height: 80 },
  glassCard: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 13,
    gap: 10,
  },
  googleIconText: { fontSize: 16, fontWeight: "800", color: "#4285F4" },
  googleButtonText: { fontSize: 15, fontWeight: "600", color: "#333" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  dividerText: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#fff",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  loginButton: {
    backgroundColor: "#800020",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  loginButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
  registerLink: { marginTop: 16, alignItems: "center" },
  registerLinkText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  registerLinkBold: { color: "#fff", fontWeight: "700" },
});
