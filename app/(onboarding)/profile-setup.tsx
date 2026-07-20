import { useState, useCallback } from "react";
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
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";
import { auth } from "@/config/firebase";
import { api } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { palette } from "@/constants/theme";
import { INTERESTS_LIST, INTERESTS_MAX } from "@/constants/interests";
import { CityPicker } from "@/components/common/CityPicker";
import { useLanguage } from "@/context/LanguageContext";

const GENDER_KEYS = ["male", "female", "other"] as const;
type GenderKey = typeof GENDER_KEYS[number];
type Step = "photo" | "info" | "about";

export default function ProfileSetupScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("photo");
  const [photoUri, setPhotoUri] = useState<string>(user?.photoURL ?? "");
  // Name was set during register — read latest from profile/auth, no local edit needed
  const currentName = profile?.name || user?.displayName || "";
  const [gender, setGender] = useState<GenderKey | "">("");

  const GENDER_LABEL_MAP: Record<GenderKey, string> = {
    male: t("setup_gender_male"),
    female: t("setup_gender_female"),
    other: t("setup_gender_other"),
  };
  // Map gender key to Firestore value (always stored in Turkish for backward compat)
  const GENDER_VALUE_MAP: Record<GenderKey, string> = {
    male: "Erkek",
    female: "Kadın",
    other: "Diğer",
  };
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  // Video bg same as login/register
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

  // Dark glassmorphism palette (matches login/register vibe)
  const glassColors = {
    background: "#000",
    surface: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.18)",
    text: "#fff",
    textMuted: "rgba(255,255,255,0.55)",
    primary: palette.primary,
    card: "rgba(0,0,0,0.85)",
  };

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(t("setup_permission_title"), t("setup_permission_gallery"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function toggleInterest(item: string) {
    setInterests((prev) => {
      if (prev.includes(item)) return prev.filter((i) => i !== item);
      if (prev.length >= INTERESTS_MAX) {
        showAlert(t("setup_limit_title"), t("setup_limit_interests", { max: INTERESTS_MAX }));
        return prev;
      }
      return [...prev, item];
    });
  }

  async function uploadPhoto(_uid: string): Promise<string> {
    if (!photoUri) return "";
    if (photoUri.startsWith("http")) return photoUri;
    const result = await api.upload("avatars", photoUri);
    return result.url;
  }

  function goNext() {
    if (step === "photo") {
      if (!photoUri) {
        showAlert(t("setup_photo_required_title"), t("setup_photo_required_desc"));
        return;
      }
      setStep("info");
    }
    else if (step === "info") {
      if (!gender) return showAlert(t("common_error"), t("setup_error_gender"));
      if (!city) return showAlert(t("common_error"), t("setup_error_city"));
      setStep("about");
    }
  }

  async function handleSave() {
    if (saving) return;
    if (interests.length === 0) {
      showAlert(t("common_error"), t("setup_error_interests"));
      return;
    }
    setSaving(true);
    try {
      const uid = user!.uid;
      const downloadURL = await uploadPhoto(uid);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: currentName.trim() || undefined,
          photoURL: downloadURL,
        });
      }

      // Don't overwrite name if it's empty — register already set it
      const updates: Record<string, unknown> = {
        photoURL: downloadURL,
        gender: GENDER_VALUE_MAP[gender as GenderKey] ?? gender,
        city,
        bio: bio.trim(),
        interests,
        profileComplete: true,
      };
      // Only write name if we actually have one (don't overwrite with "")
      if (currentName.trim()) {
        updates.name = currentName.trim();
      }
      await api.put("/api/users/me", updates);
      await refreshProfile();
    } catch (e: any) {
      showAlert(t("auth_register_failed"), e.message ?? t("common_error"));
    } finally {
      setSaving(false);
    }
  }

  const steps: Step[] = ["photo", "info", "about"];
  const stepIndex = steps.indexOf(step);

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
        colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.9)"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
            {/* Header */}
            <View style={styles.header}>
              {step !== "photo" && (
                <Pressable
                  onPress={() => {
                    if (step === "info") setStep("photo");
                    if (step === "about") setStep("info");
                  }}
                  hitSlop={12}
                  style={styles.headerBack}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
              )}
              <Image
                source={require("../../public/eslesbulustransp.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerStep}>
                {stepIndex + 1}/{steps.length}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
              {steps.map((s, i) => (
                <View
                  key={s}
                  style={[
                    styles.progressSegment,
                    i <= stepIndex && {
                      backgroundColor: palette.primary,
                    },
                  ]}
                />
              ))}
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* STEP 1: PHOTO */}
              {step === "photo" && (
                <Animated.View entering={FadeInDown.duration(360)}>
                  <BlurView intensity={28} tint="dark" style={styles.glassCard}>
                    <Text style={styles.stepTitle}>{t("setup_photo_title")}</Text>
                    <Text style={styles.stepSubtitle}>
                      {t("setup_photo_desc")}
                    </Text>

                    <Pressable onPress={pickPhoto} style={styles.photoCircle}>
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photoImage} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="camera-outline" size={42} color={palette.primary} />
                          <Text style={styles.photoPlaceholderText}>{t("setup_photo_add")}</Text>
                        </View>
                      )}
                      <View style={styles.photoEditBadge}>
                        <Ionicons name="pencil" size={14} color="#fff" />
                      </View>
                    </Pressable>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={goNext}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryButtonText}>{t("setup_continue")}</Text>
                    </TouchableOpacity>
                  </BlurView>
                </Animated.View>
              )}

              {/* STEP 2: INFO */}
              {step === "info" && (
                <Animated.View entering={FadeInDown.duration(360)}>
                  <BlurView intensity={28} tint="dark" style={styles.glassCard}>
                    <Text style={styles.stepTitle}>{t("setup_info_title")}</Text>
                    <Text style={styles.stepSubtitle}>{t("setup_info_desc")}</Text>

                    {/* Gender */}
                    <Text style={styles.fieldLabel}>{t("setup_gender")}</Text>
                    <View style={styles.genderRow}>
                      {GENDER_KEYS.map((g) => {
                        const active = gender === g;
                        return (
                          <Pressable
                            key={g}
                            style={[styles.genderChip, active && styles.genderChipActive]}
                            onPress={() => setGender(g)}
                          >
                            <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
                              {GENDER_LABEL_MAP[g]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* City */}
                    <Text style={styles.fieldLabel}>{t("setup_city")}</Text>
                    <Pressable
                      style={[styles.input, styles.cityPicker]}
                      onPress={() => setCityPickerOpen(true)}
                    >
                      <Ionicons name="location-outline" size={18} color={glassColors.textMuted} />
                      <Text style={[styles.cityPickerText, !city && { color: glassColors.textMuted }]}>
                        {city || t("setup_city_select")}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={glassColors.textMuted} />
                    </Pressable>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={goNext}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryButtonText}>{t("setup_continue")}</Text>
                    </TouchableOpacity>
                  </BlurView>
                </Animated.View>
              )}

              {/* STEP 3: ABOUT */}
              {step === "about" && (
                <Animated.View entering={FadeInDown.duration(360)}>
                  <BlurView intensity={28} tint="dark" style={styles.glassCard}>
                    <Text style={styles.stepTitle}>{t("setup_bio_title")}</Text>
                    <Text style={styles.stepSubtitle}>
                      {t("setup_bio_desc", { max: INTERESTS_MAX })}
                    </Text>

                    <View style={styles.inputWrap}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={glassColors.textMuted} style={[styles.inputIcon, { top: 14 }]} />
                      <TextInput
                        style={[styles.input, styles.bioInput]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder={t("setup_bio_placeholder")}
                        placeholderTextColor={glassColors.textMuted}
                        multiline
                        maxLength={200}
                      />
                    </View>
                    <Text style={styles.charCount}>{bio.length}/200</Text>

                    <Text style={styles.fieldLabel}>
                      {t("setup_interests")} ({interests.length}/{INTERESTS_MAX})
                    </Text>
                    <View style={styles.interestsGrid}>
                      {INTERESTS_LIST.map((item) => {
                        const active = interests.includes(item.id);
                        return (
                          <Pressable
                            key={item.id}
                            style={[styles.interestChip, active && styles.interestChipActive]}
                            onPress={() => toggleInterest(item.id)}
                          >
                            <Text style={[styles.interestChipText, active && styles.interestChipTextActive]}>
                              {t(item.labelKey)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryButton, saving && styles.buttonDisabled]}
                      onPress={handleSave}
                      disabled={saving}
                      activeOpacity={0.85}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>{t("setup_complete")}</Text>
                      )}
                    </TouchableOpacity>
                  </BlurView>
                </Animated.View>
              )}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* City picker modal */}
      <CityPicker
        visible={cityPickerOpen}
        selected={city}
        onClose={() => setCityPickerOpen(false)}
        onSelect={setCity}
        colors={{
          background: "#0A0A0A",
          surface: "#1E1E1E",
          card: "#1a1a1a",
          border: "rgba(255,255,255,0.08)",
          text: "#FFFFFF",
          textMuted: "#A0A0A0",
          primary: palette.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerBack: { padding: 4, position: "absolute", left: 12, zIndex: 1 },
  headerLogo: { width: 130, height: 38, flex: 1, alignSelf: "center" },
  headerStep: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "700",
  },
  progressBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 6,
    marginTop: 4,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  glassCard: {
    borderRadius: 26,
    overflow: "hidden",
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  stepTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 13.5,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 22,
    lineHeight: 19,
  },

  // Photo step
  photoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: "center",
    marginBottom: 32,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: palette.primary,
    position: "relative",
  },
  photoImage: { width: "100%", height: "100%" },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoPlaceholderText: { fontSize: 13, color: palette.primary, fontWeight: "700" },
  photoEditBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },

  // Inputs
  inputWrap: { position: "relative", marginBottom: 12 },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 14,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingLeft: 42,
    paddingRight: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  bioInput: {
    minHeight: 90,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  charCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "right",
    marginTop: -8,
    marginBottom: 12,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Date input
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  dateSep: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 18,
    fontWeight: "700",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dateDayMonth: { width: 60 },
  dateYear: { flex: 1 },

  // Gender chips
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  genderChipActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  genderChipText: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  genderChipTextActive: { color: "#fff", fontWeight: "700" },

  // City
  cityPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 14,
    marginBottom: 16,
  },
  cityPickerText: { flex: 1, fontSize: 15, color: "#fff" },

  // Interests
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 22,
  },
  interestChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  interestChipActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  interestChipText: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  interestChipTextActive: { color: "#fff", fontWeight: "700" },

  // Buttons
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    shadowColor: palette.primary,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
  buttonDisabled: { opacity: 0.6 },
  buttonGhost: {
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowOpacity: 0,
    elevation: 0,
  },
});
