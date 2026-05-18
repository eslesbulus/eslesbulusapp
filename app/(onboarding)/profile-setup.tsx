import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { auth, db, storage } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

const INTERESTS = [
  "Müzik", "Spor", "Seyahat", "Yemek", "Sanat", "Film",
  "Kitap", "Dans", "Doğa", "Teknoloji", "Fotoğrafçılık", "Yoga",
  "Oyun", "Moda", "Şarap", "Kahve",
];

const GENDERS = ["Erkek", "Kadın", "Diğer"];

type Step = "photo" | "info" | "about";

export default function ProfileSetupScreen() {
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("photo");
  const [photoUri, setPhotoUri] = useState<string>(user?.photoURL ?? "");
  const [name, setName] = useState(user?.displayName ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri iznine ihtiyacımız var.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function toggleInterest(item: string) {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function uploadPhoto(uid: string): Promise<string> {
    if (!photoUri || photoUri.startsWith("http")) return photoUri;
    const response = await fetch(photoUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profilePhotos/${uid}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Hata", "İsim boş bırakılamaz.");
      return;
    }
    if (!birthDate.trim()) {
      Alert.alert("Hata", "Doğum tarihi gerekli.");
      return;
    }
    if (!gender) {
      Alert.alert("Hata", "Cinsiyet seçmelisin.");
      return;
    }
    if (interests.length < 3) {
      Alert.alert("Hata", "En az 3 ilgi alanı seç.");
      return;
    }

    setSaving(true);
    try {
      const uid = user!.uid;
      const downloadURL = await uploadPhoto(uid);

      await updateProfile(auth.currentUser!, {
        displayName: name.trim(),
        photoURL: downloadURL,
      });

      await updateDoc(doc(db, "users", uid), {
        name: name.trim(),
        photoURL: downloadURL,
        birthDate: birthDate.trim(),
        gender,
        bio: bio.trim(),
        interests,
        profileComplete: true,
      });
    } catch (e: any) {
      Alert.alert("Kayıt başarısız", e.message);
    } finally {
      setSaving(false);
    }
  }

  const steps: Step[] = ["photo", "info", "about"];
  const stepIndex = steps.indexOf(step);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../public/eslesbuluslogo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerStep}>{stepIndex + 1} / {steps.length}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          {steps.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressSegment,
                i <= stepIndex && styles.progressActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Fotoğraf */}
          {step === "photo" && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Profil Fotoğrafın</Text>
              <Text style={styles.stepSubtitle}>
                İlk izlenim önemli — en güzel fotoğrafını seç
              </Text>

              <TouchableOpacity style={styles.photoCircle} onPress={pickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderIcon}>📷</Text>
                    <Text style={styles.photoPlaceholderText}>Fotoğraf Ekle</Text>
                  </View>
                )}
                <View style={styles.photoEditBadge}>
                  <Text style={styles.photoEditIcon}>✏️</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep("info")}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Kişisel Bilgiler */}
          {step === "info" && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Kendini Tanıt</Text>
              <Text style={styles.stepSubtitle}>Temel bilgilerini girelim</Text>

              <Text style={styles.label}>Adın</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Adın soyadın"
                placeholderTextColor="#bbb"
              />

              <Text style={styles.label}>Doğum Tarihi</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="GG.AA.YYYY"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Cinsiyet</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep("photo")}>
                  <Text style={styles.backButtonText}>Geri</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.primaryButtonFlex]}
                  onPress={() => setStep("about")}
                >
                  <Text style={styles.primaryButtonText}>Devam Et</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Hakkında */}
          {step === "about" && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Seni Anlat</Text>
              <Text style={styles.stepSubtitle}>
                İlgi alanların ve kendinden bir şeyler paylaş
              </Text>

              <Text style={styles.label}>Hakkında (opsiyonel)</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Kendini kısaca anlat..."
                placeholderTextColor="#bbb"
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>

              <Text style={styles.label}>İlgi Alanları (en az 3)</Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map((item) => {
                  const active = interests.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.interestChip, active && styles.interestChipActive]}
                      onPress={() => toggleInterest(item)}
                    >
                      <Text
                        style={[styles.interestChipText, active && styles.interestChipTextActive]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep("info")}>
                  <Text style={styles.backButtonText}>Geri</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.primaryButtonFlex, saving && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Tamamla 🎉</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLogo: { width: 120, height: 36 },
  headerStep: { fontSize: 14, color: "#aaa", fontWeight: "600" },
  progressBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f0f0f0",
  },
  progressActive: { backgroundColor: "#E91E63" },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  stepContainer: { flex: 1 },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 6,
    marginTop: 16,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#888",
    marginBottom: 28,
    lineHeight: 22,
  },
  photoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: "center",
    marginBottom: 40,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#E91E63",
  },
  photoImage: { width: "100%", height: "100%" },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: "#fce4ec",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  photoPlaceholderText: { fontSize: 14, color: "#E91E63", fontWeight: "600" },
  photoEditBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#E91E63",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  photoEditIcon: { fontSize: 14 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: "#bbb",
    textAlign: "right",
    marginTop: -12,
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  genderChipActive: {
    borderColor: "#E91E63",
    backgroundColor: "#fce4ec",
  },
  genderChipText: { fontSize: 14, color: "#888", fontWeight: "600" },
  genderChipTextActive: { color: "#E91E63" },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 32,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  interestChipActive: {
    borderColor: "#E91E63",
    backgroundColor: "#E91E63",
  },
  interestChipText: { fontSize: 14, color: "#666", fontWeight: "500" },
  interestChipTextActive: { color: "#fff" },
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#E91E63",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonFlex: { flex: 1 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  backButtonText: { color: "#666", fontWeight: "600", fontSize: 15 },
});
