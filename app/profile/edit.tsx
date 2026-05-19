import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { POPULAR_CITIES } from "@/constants/mockUsers";

const MAX_PHOTOS = 6;
const INTERESTS_LIST = [
  "Müzik", "Spor", "Seyahat", "Yemek", "Kitap", "Film",
  "Sanat", "Dans", "Fotoğraf", "Doğa", "Yoga", "Oyun",
  "Teknoloji", "Moda", "Kahve", "Kedi", "Köpek",
];

export default function EditProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [mainPhoto, setMainPhoto] = useState(profile?.photoURL ?? "");
  const [photos, setPhotos] = useState<string[]>(profile?.photos ?? []);
  const [saving, setSaving] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const pickMainPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraflara erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setMainPhoto(result.assets[0].uri);
    }
  }, []);

  const pickExtraPhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Limit", `En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsin.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraflara erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }, [photos]);

  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const toggleInterest = useCallback((item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Hata", "İsim boş olamaz.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        city: city.trim(),
        interests,
        photoURL: mainPhoto || undefined,
        photos,
      });
      router.back();
    } catch {
      Alert.alert("Hata", "Profil kaydedilemedi. Tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Profili Düzenle</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: c.primary }]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Kaydet</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ana Fotoğraf */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.mainPhotoSection}>
          <Pressable onPress={pickMainPhoto} style={styles.mainPhotoWrap}>
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto }} style={styles.mainPhoto} />
            ) : (
              <View style={[styles.mainPhotoPlaceholder, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="person" size={52} color={c.textMuted} />
              </View>
            )}
            <View style={[styles.mainPhotoEdit, { backgroundColor: c.primary }]}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>
          <Text style={[styles.mainPhotoHint, { color: c.textMuted }]}>Profil fotoğrafı</Text>
        </Animated.View>

        {/* Ek Fotoğraflar */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.section}>
          <Text style={[styles.label, { color: c.textMuted }]}>
            Fotoğraflar ({photos.length}/{MAX_PHOTOS})
          </Text>
          <View style={styles.photosGrid}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable
                  onPress={() => removePhoto(idx)}
                  style={[styles.photoRemoveBtn, { backgroundColor: c.primary }]}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable
                onPress={pickExtraPhoto}
                style={[styles.addPhotoBtn, { backgroundColor: c.surface, borderColor: c.border }]}
              >
                <Ionicons name="add" size={28} color={c.primary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* İsim */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.section}>
          <Text style={[styles.label, { color: c.textMuted }]}>İsim</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Adın"
            placeholderTextColor={c.textMuted}
            style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
            maxLength={40}
          />
        </Animated.View>

        {/* Şehir */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.section}>
          <Text style={[styles.label, { color: c.textMuted }]}>Şehir</Text>
          <Pressable
            onPress={() => setCityOpen((o) => !o)}
            style={[styles.input, styles.citySelector, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Text style={[styles.citySelectorText, { color: city ? c.text : c.textMuted }]}>
              {city || "Şehir seç"}
            </Text>
            <Ionicons
              name={cityOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={c.textMuted}
            />
          </Pressable>
          {cityOpen && (
            <View style={[styles.cityDropdown, { backgroundColor: c.surface, borderColor: c.border }]}>
              {POPULAR_CITIES.map((c_) => (
                <Pressable
                  key={c_}
                  onPress={() => { setCity(c_); setCityOpen(false); }}
                  style={[
                    styles.cityItem,
                    { borderBottomColor: theme.colors.border },
                    city === c_ && { backgroundColor: `${c.primary}15` },
                  ]}
                >
                  <Text style={[styles.cityItemText, { color: theme.colors.text }]}>{c_}</Text>
                  {city === c_ && <Ionicons name="checkmark" size={16} color={c.primary} />}
                </Pressable>
              ))}
              <Pressable
                style={[styles.cityItemCustom, { borderTopColor: theme.colors.border }]}
                onPress={() => setCityOpen(false)}
              >
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Başka bir şehir yaz..."
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.cityCustomInput, { color: theme.colors.text }]}
                />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Biyografi */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.section}>
          <Text style={[styles.label, { color: c.textMuted }]}>Hakkımda</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Kendini birkaç cümleyle anlat..."
            placeholderTextColor={c.textMuted}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              styles.textarea,
              { backgroundColor: c.surface, color: c.text, borderColor: c.border },
            ]}
            maxLength={300}
          />
          <Text style={[styles.charCount, { color: c.textMuted }]}>{bio.length}/300</Text>
        </Animated.View>

        {/* İlgi Alanları */}
        <Animated.View entering={FadeInDown.delay(220).duration(350)} style={styles.section}>
          <Text style={[styles.label, { color: c.textMuted }]}>İlgi Alanları</Text>
          <View style={styles.interestsGrid}>
            {INTERESTS_LIST.map((item) => {
              const active = interests.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleInterest(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? c.primary : c.surface,
                      borderColor: active ? c.primary : c.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? "#fff" : c.text }]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  mainPhotoSection: { alignItems: "center", paddingVertical: 24 },
  mainPhotoWrap: { position: "relative" },
  mainPhoto: { width: 112, height: 112, borderRadius: 56 },
  mainPhotoPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  mainPhotoEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  mainPhotoHint: { marginTop: 8, fontSize: 13 },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoThumbWrap: { position: "relative" },
  photoThumb: { width: 90, height: 120, borderRadius: 12 },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBtn: {
    width: 90,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 15,
  },
  textarea: {
    height: 110,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 4 },

  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  citySelectorText: { fontSize: 15 },
  cityDropdown: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cityItemText: { fontSize: 15 },
  cityItemCustom: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  cityCustomInput: { fontSize: 15 },

  interestsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
});
