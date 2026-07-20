import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUsers } from "@/hooks/useUsers";
import type { UserProfile } from "@/context/AuthContext";
import { type DisplayPost } from "@/constants/mockPosts";
import { addSharedPost } from "@/constants/sharedPostsStore";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  visible: boolean;
  post: DisplayPost | null;
  onClose: () => void;
  onSent: () => void;
  colors: any;
};

export function ShareSheet({ visible, post, onClose, onSent, colors: c }: Props) {
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const { users } = useUsers();
  const chatUsers = users.slice(0, 6);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentNames, setSentNames] = useState<string | null>(null);

  function toggleUser(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (selected.size === 0 || !post) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    const recipients = chatUsers.filter((u) => selected.has(u.uid));
    const sentAt = new Date().toLocaleTimeString(lang === "tr" ? "tr-TR" : "en-US", { hour: "2-digit", minute: "2-digit" });

    // Store'a kaydet — chat ekranı açıldığında okuyacak
    recipients.forEach((u) => {
      addSharedPost(u.uid, {
        id: `sp_${Date.now()}_${u.uid}`,
        postId: post.id,
        userId: post.userId,
        userName: post.userName,
        userPhoto: post.userPhoto,
        text: post.text,
        image: post.imageUrl,
        sentAt,
      });
    });

    onSent();
    setSelected(new Set());
    const names = recipients.map((u) => u.name).join(", ");
    setSentNames(names);
    setTimeout(() => {
      setSentNames(null);
      onClose();
    }, 1800);
  }

  function handleClose() {
    setSelected(new Set());
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        onPress={handleClose}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom + 12, 24) },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <Text style={[styles.title, { color: c.text }]}>{t("share_title")}</Text>
            <Pressable
              onPress={handleSend}
              disabled={selected.size === 0 || sending}
              style={[
                styles.sendBtn,
                { backgroundColor: selected.size > 0 ? c.primary : c.border },
              ]}
            >
              {sending ? (
                <Text style={styles.sendBtnText}>…</Text>
              ) : (
                <Text style={styles.sendBtnText}>
                  {selected.size > 0 ? t("share_send_count", { count: selected.size }) : t("share_send")}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Post önizleme */}
          {post && (
            <View style={[styles.postPreview, { backgroundColor: c.surface, borderColor: c.border }]}>
              {post.userPhoto ? <Image source={{ uri: post.userPhoto }} style={styles.postPreviewAvatar} /> : null}
              <Text style={[styles.postPreviewText, { color: c.text }]} numberOfLines={2}>
                {post.text || t("share_photo")}
              </Text>
            </View>
          )}

          {/* Gönderildi overlay */}
          {sentNames && (
            <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(250)} style={styles.sentOverlay}>
              <View style={[styles.sentCard, { backgroundColor: c.card }]}>
                <View style={[styles.sentIcon, { backgroundColor: `${c.primary}18` }]}>
                  <Ionicons name="checkmark-circle" size={44} color={c.primary} />
                </View>
                <Text style={[styles.sentTitle, { color: c.text }]}>{t("share_sent_title")}</Text>
                <Text style={[styles.sentDesc, { color: c.textMuted }]}>
                  {t("share_sent_desc", { names: sentNames })}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Kullanıcı Listesi */}
          <Text style={[styles.subTitle, { color: c.textMuted }]}>{t("share_select_person")}</Text>
          {chatUsers.length === 0 && (
            <View style={styles.emptyUsers}>
              <Text style={[styles.emptyUsersText, { color: c.textMuted }]}>{t("share_no_matches")}</Text>
            </View>
          )}
          <FlatList
            data={chatUsers}
            keyExtractor={(u) => u.uid}
            scrollEnabled={true}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.uid);
              const photo = item.photoURL || item.photos?.[0];
              return (
                <Pressable
                  onPress={() => toggleUser(item.uid)}
                  style={[
                    styles.userRow,
                    {
                      backgroundColor: isSelected ? `${c.primary}14` : "transparent",
                      borderColor: isSelected ? `${c.primary}40` : c.border,
                    },
                  ]}
                >
                  <View style={styles.avatarWrap}>
                    {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : null}
                    {item.online && (
                      <View style={[styles.dot, { backgroundColor: c.online, borderColor: c.card }]} />
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[styles.userMeta, { color: c.textMuted }]}>
                      {item.online ? t("discover_online") : t("discover_offline")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? c.primary : "transparent",
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    minHeight: 380,
    maxHeight: "85%",
  },
  emptyUsers: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyUsersText: { fontSize: 14 },
  sentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sentCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    gap: 10,
    width: "80%",
  },
  sentIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sentTitle: { fontSize: 20, fontWeight: "800" },
  sentDesc: { fontSize: 14, textAlign: "center" },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: "700" },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  postPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  postPreviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  postPreviewText: { flex: 1, fontSize: 13, lineHeight: 18 },

  subTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarWrap: { width: 46, height: 46, position: "relative" },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  dot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "600" },
  userMeta: { fontSize: 12, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
