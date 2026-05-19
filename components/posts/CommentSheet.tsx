import { useState, useRef } from "react";
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
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MockPost, MockComment } from "@/constants/mockPosts";

const A = (n: number) => `https://i.pravatar.cc/400?img=${n}`;

type Props = {
  post: MockPost | null;
  visible: boolean;
  onClose: () => void;
  colors: any;
};

export function CommentSheet({ post, visible, onClose, colors: c }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [comments, setComments] = useState<MockComment[]>(post?.comments ?? []);
  const inputRef = useRef<TextInput>(null);

  // Sync comments when post changes
  const currentComments = post
    ? comments.length === post.comments.length && comments[0]?.id === post.comments[0]?.id
      ? comments
      : post.comments
    : [];

  function handleSend() {
    if (!text.trim()) return;
    const newComment: MockComment = {
      id: `c_${Date.now()}`,
      userId: "me",
      userName: "Sen",
      userPhoto: A(68),
      text: text.trim(),
      createdAt: "şimdi",
    };
    setComments((prev) => [...prev, newComment]);
    setText("");
    Keyboard.dismiss();
  }

  if (!post) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.sheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 8 }]}
      >
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
        </View>

        {/* Title */}
        <View style={[styles.sheetHeader, { borderBottomColor: c.border }]}>
          <Text style={[styles.sheetTitle, { color: c.text }]}>Yorumlar</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={c.textMuted} />
          </Pressable>
        </View>

        {/* Post preview */}
        <View style={[styles.postPreview, { borderBottomColor: c.border }]}>
          <Image source={{ uri: post.userPhoto }} style={styles.previewAvatar} />
          <Text style={[styles.previewText, { color: c.text }]} numberOfLines={2}>
            <Text style={{ fontWeight: "700" }}>{post.userName} </Text>
            {post.text}
          </Text>
        </View>

        {/* Comments list */}
        <FlatList
          data={currentComments}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubble-outline" size={32} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                Henüz yorum yok. İlk sen yaz!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Image source={{ uri: item.userPhoto }} style={styles.commentAvatar} />
              <View style={[styles.commentBubble, { backgroundColor: c.surface }]}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentName, { color: c.text }]}>
                    {item.userName}
                  </Text>
                  <Text style={[styles.commentTime, { color: c.textMuted }]}>
                    {item.createdAt}
                  </Text>
                </View>
                <Text style={[styles.commentText, { color: c.text }]}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {/* Input */}
        <View style={[styles.inputRow, { borderTopColor: c.border, backgroundColor: c.card }]}>
          <Image source={{ uri: A(68) }} style={styles.inputAvatar} />
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { backgroundColor: c.surface, color: c.text, borderColor: c.border },
            ]}
            placeholder="Yorum yaz..."
            placeholderTextColor={c.textMuted}
            value={text}
            onChangeText={setText}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? c.primary : c.surface },
            ]}
          >
            <Ionicons
              name="send"
              size={16}
              color={text.trim() ? "#fff" : c.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  postPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  previewAvatar: { width: 32, height: 32, borderRadius: 16 },
  previewText: { flex: 1, fontSize: 13, lineHeight: 18 },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14 },
  commentRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, marginTop: 2 },
  commentBubble: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  commentName: { fontSize: 13, fontWeight: "700" },
  commentTime: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 19 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  inputAvatar: { width: 32, height: 32, borderRadius: 16, marginBottom: 2 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
