import { useState, useEffect } from "react";
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
  Dimensions,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { GOOGLE_WEB_CLIENT_ID } from "@/constants/googleAuth";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const videoPlayer = useVideoPlayer(
    require("../../public/home/eslesbulus.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleCredential(response.params.id_token);
    }
  }, [response]);

  async function handleGoogleCredential(idToken: string) {
    setGoogleLoading(true);
    try {
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
      Alert.alert("Google ile giriş başarısız", e.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmailLogin() {
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre boş bırakılamaz.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert("Giriş başarısız", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={videoPlayer}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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

          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => promptAsync()}
            disabled={!request || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#333" />
            ) : (
              <>
                <Image
                  source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

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
            style={styles.loginButton}
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 80,
  },
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
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
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
    backgroundColor: "#E91E63",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  registerLink: {
    marginTop: 16,
    alignItems: "center",
  },
  registerLinkText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  registerLinkBold: {
    color: "#fff",
    fontWeight: "700",
  },
});
