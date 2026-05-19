import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { MOCK_POSTS, MockPost } from "@/constants/mockPosts";
import { PostCard } from "@/components/posts/PostCard";
import { CommentSheet } from "@/components/posts/CommentSheet";

export default function PostsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<MockPost[]>(MOCK_POSTS);
  const [commentPost, setCommentPost] = useState<MockPost | null>(null);
  const [newPostModal, setNewPostModal] = useState(false);
  const [newText, setNewText] = useState("");

  function handleAddPost() {
    if (!newText.trim()) {
      Alert.alert("Hata", "Gönderi boş olamaz.");
      return;
    }
    const newPost: MockPost = {
      id: `p_${Date.now()}`,
      userId: "me",
      userName: "Sen",
      userPhoto: `https://i.pravatar.cc/400?img=68`,
      userAge: 25,
      userCity: "İstanbul",
      verified: false,
      text: newText.trim(),
      likes: 0,
      comments: [],
      createdAt: "şimdi",
    };
    setPosts((prev) => [newPost, ...prev]);
    setNewText("");
    setNewPostModal(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>Gönderi</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>Anını paylaş</Text>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          onPress={() => setNewPostModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Paylaş</Text>
        </Pressable>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: Platform.OS === "ios" ? 110 : 90,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
            <PostCard
              post={item}
              colors={c}
              onPressComment={(p) => setCommentPost(p)}
            />
          </Animated.View>
        )}
      />

      {/* Comment Sheet */}
      <CommentSheet
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
        colors={c}
      />

      {/* New Post Modal */}
      <Modal
        visible={newPostModal}
        animationType="slide"
        transparent
        onRequestClose={() => setNewPostModal(false)}
      >
        {/* Backdrop — tap outside closes */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => setNewPostModal(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.newPostSheet,
              { backgroundColor: c.card, paddingBottom: insets.bottom + 12 },
            ]}
          >
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
            </View>

            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <Pressable onPress={() => setNewPostModal(false)}>
                <Text style={[styles.cancelText, { color: c.textMuted }]}>İptal</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: c.text }]}>Yeni Gönderi</Text>
              <Pressable
                onPress={handleAddPost}
                style={[
                  styles.shareBtn,
                  { backgroundColor: newText.trim() ? c.primary : c.surface },
                ]}
              >
                <Text
                  style={[
                    styles.shareBtnText,
                    { color: newText.trim() ? "#fff" : c.textMuted },
                  ]}
                >
                  Paylaş
                </Text>
              </Pressable>
            </View>

            <View style={styles.newPostBody}>
              <Image
                source={{ uri: `https://i.pravatar.cc/400?img=68` }}
                style={styles.newPostAvatar}
              />
              <TextInput
                style={[styles.newPostInput, { color: c.text }]}
                placeholder="Ne düşünüyorsun?"
                placeholderTextColor={c.textMuted}
                value={newText}
                onChangeText={setNewText}
                multiline
                autoFocus
                maxLength={500}
              />
            </View>

            <Text style={[styles.charHint, { color: c.textMuted }]}>
              {newText.length}/500
            </Text>

            <View style={[styles.mediaRow, { borderTopColor: c.border }]}>
              <Pressable
                style={styles.mediaBtn}
                onPress={() =>
                  Alert.alert("Fotoğraf", "Firebase bağlandıktan sonra aktif olacak.")
                }
              >
                <Ionicons name="image-outline" size={22} color={c.primary} />
                <Text style={[styles.mediaBtnText, { color: c.primary }]}>Fotoğraf</Text>
              </Pressable>
              <Pressable
                style={styles.mediaBtn}
                onPress={() =>
                  Alert.alert("Video", "Firebase bağlandıktan sonra aktif olacak.")
                }
              >
                <Ionicons name="videocam-outline" size={22} color={c.primary} />
                <Text style={[styles.mediaBtnText, { color: c.primary }]}>Video</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  newPostSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 320,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  cancelText: { fontSize: 15 },
  shareBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareBtnText: { fontWeight: "700", fontSize: 14 },
  newPostBody: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  newPostAvatar: { width: 40, height: 40, borderRadius: 20 },
  newPostInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charHint: { fontSize: 12, textAlign: "right", paddingHorizontal: 16, marginBottom: 8 },
  mediaRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 20,
  },
  mediaBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  mediaBtnText: { fontSize: 14, fontWeight: "600" },
});
