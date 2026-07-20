import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Post } from "@/hooks/usePosts";
import { formatTimeAgo } from "@/constants/mockPosts";
import { useLanguage } from "@/context/LanguageContext";

const SCREEN_W = Dimensions.get("window").width;
const GRID_PAD = 16;
const GRID_GAP = 3;
const ITEM_W = Math.floor((SCREEN_W - GRID_PAD * 2 - GRID_GAP * 2) / 3);

type Props = {
  posts: Post[];
  colors: any;
};

export function UserPostsSection({ posts, colors: c }: Props) {
  const { t } = useLanguage();
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const activePosts = posts.filter((p) => !p.archived);

  if (activePosts.length === 0) return null;

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>
        {t("user_posts_title")} ({activePosts.length})
      </Text>

      <View style={styles.grid}>
        {activePosts.map((post) => (
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
            <View style={styles.gridOverlay}>
              <Ionicons name="heart" size={11} color="#fff" />
              <Text style={styles.gridOverlayText}>{post.likesCount}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Detail Modal (read-only) */}
      <Modal
        visible={detailPost !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailPost(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setDetailPost(null)}
        />
        <View style={styles.detailWrap} pointerEvents="box-none">
          {detailPost && (
            <Animated.View
              entering={FadeInDown.duration(260)}
              style={[styles.detailCard, { backgroundColor: c.card }]}
            >
              {detailPost.imageUrl ? (
                <Image source={{ uri: detailPost.imageUrl }} style={styles.detailImage} />
              ) : null}
              <View style={styles.detailBody}>
                {detailPost.text ? (
                  <Text style={[styles.detailText, { color: c.text }]}>{detailPost.text}</Text>
                ) : null}
                <View style={styles.detailMeta}>
                  <Ionicons name="heart" size={13} color={c.primary} />
                  <Text style={[styles.metaText, { color: c.textMuted }]}>
                    {t("posts_likes", { count: detailPost.likesCount })}
                  </Text>
                  <Text style={[styles.metaText, { color: c.textMuted }]}>·</Text>
                  <Text style={[styles.metaText, { color: c.textMuted }]}>
                    {formatTimeAgo(detailPost.createdAt)}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setDetailPost(null)}
                style={[styles.closeBtn, { backgroundColor: c.surface }]}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={c.text} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
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
  gridImage: { width: "100%", height: "100%", resizeMode: "cover" },
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  detailWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  detailCard: { borderRadius: 20, overflow: "hidden", maxHeight: "80%" },
  detailImage: { width: "100%", height: 280, resizeMode: "cover" },
  detailBody: { padding: 16, gap: 8 },
  detailText: { fontSize: 15, lineHeight: 22 },
  detailMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12 },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
