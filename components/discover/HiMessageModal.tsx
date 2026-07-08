import { Modal, View, Text, Pressable, StyleSheet, FlatList, Image } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { HI_MESSAGES } from "@/constants/messageTemplates";
import type { UserProfile } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onSend: (user: UserProfile, messageId: string, text: string) => void;
};

export function HiMessageModal({ visible, user, onClose, onSend }: Props) {
  const { theme, mode } = useTheme();
  const c = theme.colors;

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={mode === "dark" ? 60 : 40}
            tint={mode === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />
        </Pressable>

        <Animated.View
          entering={SlideInDown.duration(300).springify().damping(28).stiffness(200)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { backgroundColor: c.surface }]}
        >
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          <View style={styles.header}>
            <Image source={{ uri: user.photoURL || user.photos?.[0] }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: c.text }]}>
                {user.name}'e selam gönder
              </Text>
              <Text style={[styles.sub, { color: c.textMuted }]}>
                Bir mesaj seç, tek dokunuşla gönder
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={c.textMuted} />
            </Pressable>
          </View>

          <FlatList
            data={HI_MESSAGES}
            keyExtractor={(it) => it.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.delay(index * 25).duration(200)}>
                <Pressable
                  onPress={() => onSend(user, item.id, item.text)}
                  style={({ pressed }) => [
                    styles.msg,
                    {
                      backgroundColor: c.card,
                      borderColor: c.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={[styles.msgText, { color: c.text }]} numberOfLines={2}>
                    {item.text}
                  </Text>
                  <Ionicons name="send" size={16} color={c.primary} />
                </Pressable>
              </Animated.View>
            )}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "82%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  msg: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  emoji: { fontSize: 22 },
  msgText: { flex: 1, fontSize: 14, fontWeight: "500" },
});
