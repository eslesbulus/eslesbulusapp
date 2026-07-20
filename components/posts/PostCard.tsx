import { useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ReportSheet } from "@/components/common/ReportSheet";
import { VipName } from "@/components/common/VipName";
import { type DisplayPost, formatTimeAgo } from "@/constants/mockPosts";
import { useLanguage } from "@/context/LanguageContext";

const { width: W } = Dimensions.get("window");

type Props = {
  post: DisplayPost;
  colors: any;
  liked: boolean;
  onToggleLike: () => void;
  onPressComment: (post: DisplayPost) => void;
  onPressShare: (post: DisplayPost) => void;
  hasStory?: boolean;
  onPressStory?: () => void;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
};

export function PostCard({
  post,
  colors: c,
  liked,
  onToggleLike,
  onPressComment,
  onPressShare,
  hasStory,
  onPressStory,
  currentUserId,
  onDelete,
}: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  const { t } = useLanguage();
  const scale = useSharedValue(1);
  const router = useRouter();

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLike = useCallback(() => {
    scale.value = withSequence(withSpring(1.4), withSpring(1));
    onToggleLike();
  }, [onToggleLike]);

  const avatarContent = post.userPhoto ? (
    <Image source={{ uri: post.userPhoto }} style={styles.avatar} />
  ) : (
    <View style={[styles.avatar, { backgroundColor: c.border }]} />
  );

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => {
          if (post.userId && post.userName !== "Anonim") {
            router.push(`/user/${post.userId}` as any);
          }
        }}
      >
        {/* Avatar with optional story ring */}
        {hasStory ? (
          <Pressable onPress={onPressStory}>
            <LinearGradient
              colors={[c.primary, c.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyRing}
            >
              <View style={[styles.storyRingInner, { backgroundColor: c.card }]}>
                {avatarContent}
              </View>
            </LinearGradient>
          </Pressable>
        ) : (
          avatarContent
        )}
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <VipName name={post.userName} vip={post.vip} style={{ color: c.text }} fontSize={14} />
            {post.verified && (
              <Ionicons name="checkmark-circle" size={14} color={c.primary} />
            )}
          </View>
          <Text style={[styles.meta, { color: c.textMuted }]}>
            {post.userAge ? `${post.userAge} · ` : ""}
            {post.userCity ? `${post.userCity} · ` : ""}
            {formatTimeAgo(post.createdAt)}
          </Text>
        </View>
        <Pressable
          style={styles.moreBtn}
          hitSlop={8}
          onPress={() => {
            if (post.userId === currentUserId && onDelete) {
              showAlert(
                t("posts_options_title"),
                undefined,
                [
                  {
                    text: t("posts_delete"),
                    style: "destructive",
                    onPress: () =>
                      showAlert(
                        t("posts_delete"),
                        t("posts_delete_confirm"),
                        [
                          { text: t("common_delete"), style: "destructive", onPress: () => onDelete(post.id) },
                          { text: t("common_cancel"), style: "cancel" },
                        ]
                      ),
                  },
                  { text: t("common_cancel"), style: "cancel" },
                ]
              );
            } else {
              setReportOpen(true);
            }
          }}
        >
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
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
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
            {post.likesCount}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onPressComment(post)}>
          <Ionicons name="chatbubble-outline" size={21} color={c.textMuted} />
          {post.commentsCount > 0 && (
            <Text style={[styles.actionCount, { color: c.textMuted }]}>
              {post.commentsCount}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onPressShare(post)}>
          <Ionicons name="paper-plane-outline" size={21} color={c.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 42;

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
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#eee",
  },
  storyRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  storyRingInner: {
    width: AVATAR_SIZE + 1,
    height: AVATAR_SIZE + 1,
    borderRadius: (AVATAR_SIZE + 1) / 2,
    padding: 1.5,
    alignItems: "center",
    justifyContent: "center",
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
