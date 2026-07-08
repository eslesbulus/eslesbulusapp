import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { Post } from "@/hooks/usePosts";
import { formatTimeAgo } from "@/constants/mockPosts";

const SCREEN_W = Dimensions.get("window").width;
const GRID_PAD = 16;
const GRID_GAP = 3;
const ITEM_W = Math.floor((SCREEN_W - GRID_PAD * 2 - GRID_GAP * 2) / 3);

type Props = {
  posts: Post[];
  onEdit: (id: string, text: string) => Promise<void>;
  onArchive: (id: string, archived: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  colors: any;
};

export function MyPostsSection({ posts, onEdit, onArchive, onDelete, colors: c }: Props) {
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [editModal, setEditModal] = useState<{ id: string; text: string } | null>(null);
  const [editText, setEditText] = useState("");
  const [detailPost, setDetailPost] = useState<Post | null>(null);

  const activePosts = posts.filter((p) => !p.archived);
  const archivedPosts = posts.filter((p) => p.archived);
  const displayPosts = tab === "active" ? activePosts : archivedPosts;

  function openEdit(post: Post) {
    setEditText(post.text);
    setEditModal({ id: post.id, text: post.text });
  }

  async function saveEdit() {
    if (!editModal) return;
    await onEdit(editModal.id, editText.trim());
    setEditModal(null);
  }

  function confirmDelete(id: string) {
    showAlert("Gönderiyi Sil", "Bu gönderi kalıcı olarak silinecek. Emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => onDelete(id) },
    ]);
  }

  if (posts.length === 0) return null;

  return (
    <View>
      {/* Section header with tabs */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>GONDERİLERİM</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: c.card, borderColor: c.border }]}>
        <Pressable
          onPress={() => setTab("active")}
          style={[styles.tabBtn, tab === "active" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
        >
          <Ionicons name="grid-outline" size={16} color={tab === "active" ? c.primary : c.textMuted} />
          <Text style={[styles.tabLabel, { color: tab === "active" ? c.primary : c.textMuted }]}>
            Aktif ({activePosts.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("archived")}
          style={[styles.tabBtn, tab === "archived" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
        >
          <Ionicons name="archive-outline" size={16} color={tab === "archived" ? c.primary : c.textMuted} />
          <Text style={[styles.tabLabel, { color: tab === "archived" ? c.primary : c.textMuted }]}>
            Arşiv ({archivedPosts.length})
          </Text>
        </Pressable>
      </View>

      {/* Grid */}
      {displayPosts.length === 0 ? (
        <View style={[styles.emptyWrap, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name={tab === "active" ? "images-outline" : "archive-outline"} size={28} color={c.textMuted} />
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            {tab === "active" ? "Henuz gonderi yok" : "Arsivde gonderi yok"}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {displayPosts.map((post) => (
            <Pressable
              key={post.id}
              onPress={() => setDetailPost(post)}
              style={styles.gridItem}
            >
              {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
              ) : (
                <View style={[styles.gridTextOnly, { backgroundColor: c.card }]}>
                  <Text style={[styles.gridText, { color: c.text }]} numberOfLines={3}>
                    {post.text}
                  </Text>
                </View>
              )}
              {/* Likes overlay */}
              <View style={styles.gridOverlay}>
                <Ionicons name="heart" size={11} color="#fff" />
                <Text style={styles.gridOverlayText}>{post.likesCount}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Post Detail Modal */}
      <Modal
        visible={detailPost !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailPost(null)}
      >
        <Pressable
          style={styles.detailBackdrop}
          onPress={() => setDetailPost(null)}
        />
        <View style={styles.detailWrap} pointerEvents="box-none">
          {detailPost && (
            <Animated.View
              entering={FadeInDown.duration(260)}
              style={[styles.detailCard, { backgroundColor: c.card }]}
            >
              {/* Image */}
              {detailPost.imageUrl ? (
                <Image source={{ uri: detailPost.imageUrl }} style={styles.detailImage} />
              ) : null}

              {/* Text */}
              <View style={styles.detailBody}>
                {detailPost.text ? (
                  <Text style={[styles.detailText, { color: c.text }]}>{detailPost.text}</Text>
                ) : null}
                <View style={styles.detailMeta}>
                  <Ionicons name="heart" size={13} color={c.primary} />
                  <Text style={[styles.detailMetaText, { color: c.textMuted }]}>
                    {detailPost.likesCount} begeni
                  </Text>
                  <Text style={[styles.detailMetaText, { color: c.textMuted }]}>·</Text>
                  <Text style={[styles.detailMetaText, { color: c.textMuted }]}>
                    {formatTimeAgo(detailPost.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={[styles.detailActions, { borderTopColor: c.border }]}>
                <Pressable
                  onPress={() => { setDetailPost(null); openEdit(detailPost); }}
                  style={[styles.actionBtn, { backgroundColor: `${c.primary}14` }]}
                >
                  <Ionicons name="create-outline" size={18} color={c.primary} />
                  <Text style={[styles.actionLabel, { color: c.primary }]}>Duzenle</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onArchive(detailPost.id, !detailPost.archived);
                    setDetailPost(null);
                  }}
                  style={[styles.actionBtn, { backgroundColor: `${c.textMuted}14` }]}
                >
                  <Ionicons
                    name={detailPost.archived ? "arrow-undo-outline" : "archive-outline"}
                    size={18}
                    color={c.textMuted}
                  />
                  <Text style={[styles.actionLabel, { color: c.textMuted }]}>
                    {detailPost.archived ? "Geri Al" : "Arsivle"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { setDetailPost(null); confirmDelete(detailPost.id); }}
                  style={[styles.actionBtn, { backgroundColor: "rgba(229,57,53,0.08)" }]}
                >
                  <Ionicons name="trash-outline" size={18} color="#E53935" />
                  <Text style={[styles.actionLabel, { color: "#E53935" }]}>Sil</Text>
                </Pressable>
              </View>

              {/* Close button */}
              <Pressable
                onPress={() => setDetailPost(null)}
                style={[styles.detailClose, { backgroundColor: c.surface }]}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={c.text} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModal(null)}
      >
        <Pressable
          style={styles.detailBackdrop}
          onPress={() => setEditModal(null)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.editWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.editCard, { backgroundColor: c.card }]}
          >
            <Text style={[styles.editTitle, { color: c.text }]}>Gonderiyi Duzenle</Text>
            <TextInput
              style={[styles.editInput, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={500}
              placeholder="Gonderi metni..."
              placeholderTextColor={c.textMuted}
              autoFocus
            />
            <Text style={[styles.editCharCount, { color: c.textMuted }]}>
              {editText.length}/500
            </Text>
            <View style={styles.editBtns}>
              <Pressable
                onPress={() => setEditModal(null)}
                style={[styles.editCancelBtn, { borderColor: c.border }]}
              >
                <Text style={[styles.editCancelText, { color: c.text }]}>Iptal</Text>
              </Pressable>
              <Pressable
                onPress={saveEdit}
                style={[styles.editSaveBtn, { backgroundColor: c.primary }]}
              >
                <Text style={styles.editSaveText}>Kaydet</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 13, fontWeight: "600" },

  emptyWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 13, fontWeight: "500" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: GRID_PAD,
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_W,
    height: ITEM_W,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridTextOnly: {
    width: "100%",
    height: "100%",
    padding: 8,
    justifyContent: "center",
  },
  gridText: { fontSize: 11, lineHeight: 15 },
  gridOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridOverlayText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Detail modal
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  detailWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  detailCard: {
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "80%",
  },
  detailImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },
  detailBody: { padding: 16, gap: 8 },
  detailText: { fontSize: 15, lineHeight: 22 },
  detailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailMetaText: { fontSize: 12 },
  detailActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionLabel: { fontSize: 12, fontWeight: "700" },
  detailClose: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Edit modal
  editWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  editCard: {
    borderRadius: 20,
    padding: 20,
  },
  editTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14 },
  editInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    textAlignVertical: "top",
    minHeight: 120,
    maxHeight: 200,
  },
  editCharCount: { fontSize: 11, textAlign: "right", marginTop: 4, marginBottom: 14 },
  editBtns: { flexDirection: "row", gap: 10 },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  editCancelText: { fontSize: 15, fontWeight: "600" },
  editSaveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  editSaveText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
