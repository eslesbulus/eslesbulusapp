import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MockPost } from "@/constants/mockPosts";
import { ReportSheet } from "@/components/common/ReportSheet";

const { width: W } = Dimensions.get("window");

type Props = {
  post: MockPost;
  colors: any;
  onPressComment: (post: MockPost) => void;
};

export function PostCard({ post, colors: c, onPressComment }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [reportOpen, setReportOpen] = useState(false);
  const scale = useSharedValue(1);
  const router = useRouter();

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handleLike() {
    scale.value = withSequence(withSpring(1.4), withSpring(1));
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  }

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => router.push(`/user/${post.userId}`)}
      >
        <Image source={{ uri: post.userPhoto }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: c.text }]}>{post.userName}</Text>
            {post.verified && (
              <Ionicons name="checkmark-circle" size={14} color={c.primary} />
            )}
          </View>
          <Text style={[styles.meta, { color: c.textMuted }]}>
            {post.userAge} · {post.userCity} · {post.createdAt}
          </Text>
        </View>
        <Pressable style={styles.moreBtn} hitSlop={8} onPress={() => setReportOpen(true)}>
          <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
        </Pressable>
      </Pressable>

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        type="post"
        targetName={post.userName}
        targetId={post.userId}
        targetPhoto={post.userPhoto}
      />

      {/* Text */}
      {post.text ? (
        <Text style={[styles.postText, { color: c.text }]}>{post.text}</Text>
      ) : null}

      {/* Image */}
      {post.image ? (
        <Image
          source={{ uri: post.image }}
          style={[styles.postImage, { backgroundColor: c.surface }]}
          resizeMode="cover"
        />
      ) : null}

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: c.border }]}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={heartStyle}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={22}
              color={liked ? "#E91E63" : c.textMuted}
            />
          </Animated.View>
          <Text style={[styles.actionCount, { color: liked ? "#E91E63" : c.textMuted }]}>
            {likeCount}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onPressComment(post)}>
          <Ionicons name="chatbubble-outline" size={21} color={c.textMuted} />
          <Text style={[styles.actionCount, { color: c.textMuted }]}>
            {post.comments.length}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn}>
          <Ionicons name="paper-plane-outline" size={21} color={c.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eee",
  },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  moreBtn: { padding: 4 },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  postImage: {
    width: "100%",
    height: W * 0.85,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    borderRadius: 999,
  },
  actionCount: { fontSize: 13, fontWeight: "600" },
});
