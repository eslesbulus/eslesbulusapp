import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import { usePostComments, type PostComment } from "@/hooks/usePosts";
import { formatTimeAgo } from "@/constants/mockPosts";

const { height: H } = Dimensions.get("window");

type Props = {
  postId: string | null;
  postUserName?: string;
  visible: boolean;
  onClose: () => void;
  colors: any;
};

export function CommentSheet({ postId, postUserName, visible, onClose, colors: c }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { comments, addComment } = usePostComments(visible ? postId : null);
  const [text, setText] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  const translateY = useSharedValue(H);
  const backdrop = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  useEffect(() => {
    if (visible) {
      backdrop.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.exp) });
    } else {
      backdrop.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) });
      translateY.value = withTiming(H, { duration: 260, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setText("");
      setLikedIds(new Set());
    }
  }, [postId, visible]);

  async function handleSend() {
    if (!text.trim()) return;
    await addComment(text.trim());
    setText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }

  function toggleLikeComment(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  if (!postId && !visible) return null;

  const userPhoto = profile?.photoURL ?? "";

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]} pointerEvents={visible ? "auto" : "none"}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kavWrap}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: c.card, paddingBottom: insets.bottom + 8 },
            sheetStyle,
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
          </View>

          <View style={[styles.sheetHeader, { borderBottomColor: c.border }]}>
            <View style={{ width: 22 }} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Yorumlar</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={c.textMuted} />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={comments}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 14 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Animated.View entering={FadeIn.duration(300)} style={styles.emptyWrap}>
                <View style={[styles.emptyIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={30} color={c.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>Henüz yorum yok</Text>
                <Text style={[styles.emptyHint, { color: c.textMuted }]}>İlk yorum yapan sen ol</Text>
              </Animated.View>
            }
            renderItem={({ item }) => (
              <CommentRow
                item={item}
                liked={likedIds.has(item.id)}
                onLike={() => toggleLikeComment(item.id)}
                colors={c}
              />
            )}
          />

          <View style={[styles.inputBar, { borderTopColor: c.border, backgroundColor: c.card }]}>
            {userPhoto ? <Image source={{ uri: userPhoto }} style={styles.inputAvatar} /> : null}
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: c.text }]}
                placeholder={`${postUserName ?? ""} gönderisine yorum yaz...`}
                placeholderTextColor={c.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={300}
              />
              {text.trim().length > 0 && (
                <Pressable onPress={handleSend} hitSlop={8} style={styles.sendBtn}>
                  <Text style={[styles.sendText, { color: c.primary }]}>Paylaş</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CommentRow({
  item,
  liked,
  onLike,
  colors: c,
}: {
  item: PostComment;
  liked: boolean;
  onLike: () => void;
  colors: any;
}) {
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  function handleLike() {
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 5, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    onLike();
  }

  return (
    <View style={styles.commentRow}>
      {item.userPhoto ? (
        <Image source={{ uri: item.userPhoto }} style={styles.commentAvatar} />
      ) : (
        <View style={[styles.commentAvatar, { backgroundColor: "#ddd" }]} />
      )}
      <View style={styles.commentBody}>
        <Text style={styles.commentLine}>
          <Text style={[styles.commentName, { color: c.text }]}>{item.userName} </Text>
          <Text style={[styles.commentText, { color: c.text }]}>{item.text}</Text>
        </Text>
        <View style={styles.commentMeta}>
          <Text style={[styles.metaText, { color: c.textMuted }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
          {liked && <Text style={[styles.metaText, { color: c.textMuted }]}>1 beğeni</Text>}
        </View>
      </View>
      <Pressable onPress={handleLike} hitSlop={10} style={styles.likeBtn}>
        <Animated.View style={heartStyle}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={14}
            color={liked ? "#E91E63" : c.textMuted}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kavWrap: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    height: H * 0.78,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 15, fontWeight: "700" },
  list: { flex: 1 },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyHint: { fontSize: 13 },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginTop: 2 },
  commentBody: { flex: 1, paddingRight: 8 },
  commentLine: { fontSize: 13.5, lineHeight: 19 },
  commentName: { fontWeight: "700" },
  commentText: { fontWeight: "400" },
  commentMeta: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
    alignItems: "center",
  },
  metaText: { fontSize: 11.5 },
  likeBtn: {
    paddingTop: 6,
    paddingLeft: 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  inputAvatar: { width: 30, height: 30, borderRadius: 15, marginBottom: 4 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 38,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 90,
    paddingVertical: 6,
  },
  sendBtn: { paddingLeft: 10, paddingRight: 2, paddingVertical: 6 },
  sendText: { fontSize: 14, fontWeight: "700" },
});
