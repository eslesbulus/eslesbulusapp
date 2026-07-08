import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/context/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { usePosts } from "@/hooks/usePosts";
import { useStories } from "@/hooks/useStories";
import { enrichPosts, type DisplayPost } from "@/constants/mockPosts";
import { PostCard } from "@/components/posts/PostCard";
import { CommentSheet } from "@/components/posts/CommentSheet";
import { ShareSheet } from "@/components/posts/ShareSheet";
import { VipName } from "@/components/common/VipName";

export default function PostsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { users, loading: usersLoading } = useUsers(undefined, { includeIncomplete: true });
  const { posts: rawPosts, loading: postsLoading, createPost, isPostLiked, togglePostLike, deletePost } = usePosts();
  const feedLoading = postsLoading || usersLoading;
  const { hasStory, storyUserIds, myStories, getStoriesForUser } = useStories();

  const userMap = useMemo(() => {
    const m = new Map<string, UserProfile>();
    users.forEach((u) => m.set(u.uid, u));
    if (profile) m.set(profile.uid, profile as UserProfile);
    return m;
  }, [users, profile]);

  const displayPosts = useMemo(
    () => enrichPosts(rawPosts, userMap, profile as UserProfile | null),
    [rawPosts, userMap, profile]
  );

  const hasOwnStory = myStories.length > 0;

  const storyBarUsers = useMemo(() => {
    return users.filter((u) => storyUserIds.has(u.uid) && u.uid !== profile?.uid);
  }, [users, storyUserIds, profile?.uid]);

  const showStoryBar = hasOwnStory || storyBarUsers.length > 0;
  // Sadece gerçekten gösterilecek balonlar varsa çubuğu göster

  const [commentPost, setCommentPost] = useState<DisplayPost | null>(null);
  const [sharePost, setSharePost] = useState<DisplayPost | null>(null);
  const [newPostModal, setNewPostModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("İzin Gerekli", "Galeri erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setNewImage(result.assets[0].uri);
  }

  async function handlePickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("İzin Gerekli", "Galeri erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setNewImage(result.assets[0].uri);
  }

  async function handleAddPost() {
    if (!newText.trim() && !newImage) {
      showAlert("Hata", "Gönderi boş olamaz.");
      return;
    }
    setPosting(true);
    try {
      await createPost(newText.trim(), newImage ?? undefined);
      setNewText("");
      setNewImage(null);
      setNewPostModal(false);
    } catch (e: any) {
      showAlert("Hata", e.message ?? "Gönderi paylaşılamadı.");
    }
    setPosting(false);
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
      {feedLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : displayPosts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="document-text-outline" size={40} color={c.textMuted} />
          <Text style={[styles.emptyText, { color: c.textMuted }]}>Henüz gönderi yok</Text>
          <Text style={[styles.emptyHint, { color: c.textMuted }]}>İlk gönderiyi sen paylaş!</Text>
        </View>
      ) : (
        <FlatList
          data={displayPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: Platform.OS === "ios" ? 110 : 90,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showStoryBar ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storyBar}
              >
                {profile && hasOwnStory && (
                  <Pressable
                    onPress={() => router.push(`/story/${profile.uid}` as any)}
                    style={styles.storyItem}
                  >
                    <LinearGradient
                      colors={[c.primary, c.secondary]}
                      style={styles.storyGradientRing}
                    >
                      <View style={[styles.storyAvatarInner, { borderColor: c.background }]}>
                        {(myStories[0]?.imageUrl || profile.photoURL || profile.photos?.[0]) ? (
                          <Image
                            source={{
                              uri: myStories[0]?.imageUrl || profile.photoURL || profile.photos?.[0],
                            }}
                            style={styles.storyAvatar}
                          />
                        ) : null}
                      </View>
                    </LinearGradient>
                    <Text style={[styles.storyName, { color: c.textMuted }]} numberOfLines={1}>
                      Hikayen
                    </Text>
                  </Pressable>
                )}
                {storyBarUsers.map((u) => {
                  const storyPreview = getStoriesForUser(u.uid)[0]?.imageUrl;
                  const displayPhoto = storyPreview || u.photoURL || u.photos?.[0] || null;
                  return (
                    <Pressable
                      key={u.uid}
                      onPress={() => router.push(`/story/${u.uid}` as any)}
                      style={styles.storyItem}
                    >
                      <LinearGradient
                        colors={u.vip ? ["#FFD700", "#FFA500", "#FFD700"] : [c.primary, c.secondary]}
                        style={styles.storyGradientRing}
                      >
                        <View style={[styles.storyAvatarInner, { borderColor: c.background }]}>
                          {displayPhoto ? (
                            <Image
                              source={{ uri: displayPhoto }}
                              style={styles.storyAvatar}
                            />
                          ) : null}
                        </View>
                      </LinearGradient>
                      <VipName name={u.name} vip={u.vip} style={{ color: c.textMuted }} fontSize={11} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(300)}>
              <PostCard
                post={item}
                colors={c}
                liked={isPostLiked(item.id)}
                onToggleLike={() => togglePostLike(item.id)}
                onPressComment={(p) => setCommentPost(p)}
                onPressShare={(p) => setSharePost(p)}
                hasStory={hasStory(item.userId)}
                onPressStory={() => router.push(`/story/${item.userId}` as any)}
                currentUserId={profile?.uid}
                onDelete={(postId) => deletePost(postId)}
              />
            </Animated.View>
          )}
        />
      )}

      {/* Comment Sheet */}
      <CommentSheet
        postId={commentPost?.id ?? null}
        postUserName={commentPost?.userName}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
        colors={c}
      />

      {/* Share Sheet */}
      <ShareSheet
        visible={!!sharePost}
        post={sharePost}
        onClose={() => setSharePost(null)}
        onSent={() => {}}
        colors={c}
      />

      {/* New Post Modal */}
      <Modal
        visible={newPostModal}
        animationType="slide"
        transparent
        onRequestClose={() => setNewPostModal(false)}
      >
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
              <Pressable onPress={() => { setNewPostModal(false); setNewImage(null); }}>
                <Text style={[styles.cancelText, { color: c.textMuted }]}>İptal</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: c.text }]}>Yeni Gönderi</Text>
              <Pressable
                onPress={handleAddPost}
                disabled={posting}
                style={[
                  styles.shareBtn,
                  { backgroundColor: (newText.trim() || newImage) ? c.primary : c.surface },
                ]}
              >
                {posting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.shareBtnText,
                      { color: (newText.trim() || newImage) ? "#fff" : c.textMuted },
                    ]}
                  >
                    Paylaş
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.newPostBody}>
              <Image
                source={{ uri: profile?.photoURL || "https://i.pravatar.cc/400?img=68" }}
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

            {newImage && (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: newImage }} style={styles.imagePreview} />
                <Pressable onPress={() => setNewImage(null)} style={styles.imageRemoveBtn}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </Pressable>
              </View>
            )}

            <Text style={[styles.charHint, { color: c.textMuted }]}>
              {newText.length}/500
            </Text>

            <View style={[styles.mediaRow, { borderTopColor: c.border }]}>
              <Pressable style={styles.mediaBtn} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={22} color={c.primary} />
                <Text style={[styles.mediaBtnText, { color: c.primary }]}>Fotoğraf</Text>
              </Pressable>
              <Pressable style={styles.mediaBtn} onPress={handlePickVideo}>
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
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 80 },
  emptyText: { fontSize: 16, fontWeight: "700" },
  emptyHint: { fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
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
    minWidth: 72,
    alignItems: "center",
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
  imagePreviewWrap: { marginHorizontal: 16, marginBottom: 8, position: "relative" },
  imagePreview: { width: "100%", height: 180, borderRadius: 14 },
  imageRemoveBtn: { position: "absolute", top: 6, right: 6 },
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

  // Story bar
  storyBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 14,
  },
  storyItem: {
    alignItems: "center",
    gap: 5,
    width: 62,
  },
  storyGradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatarInner: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
    overflow: "hidden",
  },
  storyAvatarBorder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  storyAvatar: { width: "100%", height: "100%" },
  storyName: { fontSize: 11, textAlign: "center", maxWidth: 62 },
});
