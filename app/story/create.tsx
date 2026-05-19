import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";

const { height: H } = Dimensions.get("window");

export default function StoryCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;

  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Galeri erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Kamera erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }

  async function handlePost() {
    if (!photo) {
      Alert.alert("Fotoğraf Ekle", "Hikaye için önce bir fotoğraf seç.");
      return;
    }
    setPosting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setPosting(false);
    Alert.alert("Hikaye Paylaşıldı!", "Hikayen 24 saat boyunca görünecek.", [
      { text: "Tamam", onPress: () => router.back() },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: c.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Hikaye Ekle</Text>
        <Pressable
          onPress={handlePost}
          disabled={posting || !photo}
          style={[
            styles.shareBtn,
            { backgroundColor: photo ? c.primary : c.surface },
          ]}
        >
          {posting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.shareBtnText, { color: photo ? "#fff" : c.textMuted }]}>
              Paylaş
            </Text>
          )}
        </Pressable>
      </View>

      {/* Content */}
      {photo ? (
        /* ── Preview mode ── */
        <Animated.View entering={FadeIn.duration(300)} style={styles.previewWrap}>
          <Image source={{ uri: photo }} style={styles.previewImg} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.previewGrad}
          />

          {/* Caption */}
          <TextInput
            style={styles.captionInput}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={150}
          />

          {/* Remove */}
          <Pressable
            onPress={() => setPhoto(null)}
            style={styles.removeBtn}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={30} color="rgba(255,255,255,0.85)" />
          </Pressable>

          {/* Story tip */}
          <View style={styles.storyTipWrap}>
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.6)" />
            <Text style={styles.storyTip}>24 saat sonra otomatik silinir</Text>
          </View>
        </Animated.View>
      ) : (
        /* ── Pick mode ── */
        <Animated.View entering={FadeInDown.duration(320)} style={styles.pickArea}>
          <View
            style={[
              styles.placeholder,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Ionicons name="image-outline" size={54} color={c.textMuted} />
            <Text style={[styles.placeTitle, { color: c.text }]}>Fotoğraf Seç</Text>
            <Text style={[styles.placeHint, { color: c.textMuted }]}>
              9:16 oranında en iyi görünür
            </Text>
          </View>

          <View style={styles.pickBtns}>
            <Pressable
              onPress={pickPhoto}
              style={[styles.pickBtn, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <View style={[styles.pickBtnIcon, { backgroundColor: c.primary + "22" }]}>
                <Ionicons name="images-outline" size={26} color={c.primary} />
              </View>
              <Text style={[styles.pickBtnLabel, { color: c.text }]}>Galeri</Text>
              <Text style={[styles.pickBtnHint, { color: c.textMuted }]}>Fotoğraf seç</Text>
            </Pressable>

            <Pressable
              onPress={openCamera}
              style={[styles.pickBtn, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <View style={[styles.pickBtnIcon, { backgroundColor: c.primary + "22" }]}>
                <Ionicons name="camera-outline" size={26} color={c.primary} />
              </View>
              <Text style={[styles.pickBtnLabel, { color: c.text }]}>Kamera</Text>
              <Text style={[styles.pickBtnHint, { color: c.textMuted }]}>Anında çek</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  closeBtn: { padding: 2 },
  title: { flex: 1, fontSize: 17, fontWeight: "700" },
  shareBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 76,
    alignItems: "center",
  },
  shareBtnText: { fontSize: 14, fontWeight: "700" },

  // Preview
  previewWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: "100%" },
  previewGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  captionInput: {
    position: "absolute",
    bottom: 48,
    left: 16,
    right: 52,
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    maxHeight: 100,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  removeBtn: { position: "absolute", top: 12, right: 12 },
  storyTipWrap: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  storyTip: { fontSize: 11.5, color: "rgba(255,255,255,0.55)" },

  // Pick
  pickArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 28,
    alignItems: "center",
  },
  placeholder: {
    width: "100%",
    height: Math.min(H * 0.38, 300),
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  placeTitle: { fontSize: 18, fontWeight: "700" },
  placeHint: { fontSize: 13 },

  pickBtns: {
    flexDirection: "row",
    gap: 14,
    width: "100%",
  },
  pickBtn: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  pickBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pickBtnLabel: { fontSize: 15, fontWeight: "700" },
  pickBtnHint: { fontSize: 12 },
});
