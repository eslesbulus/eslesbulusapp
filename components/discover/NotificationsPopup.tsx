import { useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable, Image, FlatList } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  FadeIn,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications, type NotificationData } from "@/hooks/useNotifications";
import { notifLabel, formatNotifTime } from "@/constants/notifications";
import { usePremium } from "@/context/PremiumContext";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  topInset?: number;
};

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export function NotificationsPopup({ visible, onClose, topInset = 0 }: Props) {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const c = theme.colors;
  const { isPremium } = usePremium();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification, clearAll } = useNotifications();

  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 380, easing: EASE_OUT });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220, easing: EASE_IN }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-24, 0]) },
      { translateX: interpolate(progress.value, [0, 1], [40, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.92, 1]) },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  function handlePress(n: NotificationData) {
    markRead(n.id);
    onClose();
    setTimeout(() => {
      switch (n.type) {
        case "message":
        case "story_reply":
          router.push(`/chat/${n.fromUid}`);
          break;
        case "like":
        case "profile_view":
        case "hi":
          router.push(`/user/${n.fromUid}`);
          break;
        case "match":
          router.push("/(tabs)/matches");
          break;
        case "story_view":
          if (n.storyId) router.push(`/story/${n.storyId}`);
          else router.push(`/user/${n.fromUid}`);
          break;
      }
    }, 240);
  }

  // Premium olmayan kullanıcılar için fotoğraf bulanıklaştır
  const shouldBlurPhoto = (n: NotificationData) => {
    if (isPremium) return false;
    return n.type === "profile_view" || n.type === "like";
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={mode === "dark" ? 30 : 18}
            tint={mode === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.32)" }]} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          { top: topInset + 8, backgroundColor: c.surface, borderColor: c.border },
          panelStyle,
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="notifications" size={18} color={c.primary} />
            <Text style={[styles.title, { color: c.text }]}>{t("notif_title")}</Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadPill, { backgroundColor: c.primary }]}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} hitSlop={10} style={styles.readAllBtn}>
                <Ionicons name="checkmark-done" size={18} color={c.primary} />
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable onPress={clearAll} hitSlop={10} style={styles.readAllBtn}>
                <Ionicons name="trash-outline" size={17} color={c.textMuted} />
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={c.textMuted} />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: c.border }]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const lbl = notifLabel(item.type);
            const blurred = shouldBlurPhoto(item);

            return (
              <Animated.View entering={FadeIn.delay(80 + index * 35).duration(280)} style={styles.itemRow}>
                <Pressable
                  onPress={() => handlePress(item)}
                  style={({ pressed }) => [
                    styles.item,
                    {
                      flex: 1,
                      backgroundColor: !item.read
                        ? mode === "dark"
                          ? "rgba(128,0,32,0.10)"
                          : "rgba(128,0,32,0.05)"
                        : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.avatarWrap}>
                    {item.fromPhoto ? (
                      <View>
                        <Image source={{ uri: item.fromPhoto }} style={styles.avatar} />
                        {blurred && (
                          <BlurView
                            intensity={20}
                            style={[styles.avatar, StyleSheet.absoluteFill]}
                          />
                        )}
                      </View>
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: c.border }]}>
                        <Ionicons name="person" size={20} color={c.textMuted} />
                      </View>
                    )}
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: c.primary, borderColor: c.surface },
                      ]}
                    >
                      <Ionicons name={lbl.icon as any} size={11} color="#fff" />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.lineRow}>
                      <Text style={[styles.userName, { color: c.text }]} numberOfLines={1}>
                        {blurred && !isPremium ? "???" : item.fromName}
                      </Text>
                      <Text style={[styles.action, { color: c.textMuted }]} numberOfLines={1}>
                        {" "}
                        {lbl.text}
                      </Text>
                    </View>
                    {item.text ? (
                      <Text style={[styles.msgPreview, { color: c.textMuted }]} numberOfLines={1}>
                        {item.text}
                      </Text>
                    ) : null}
                    <Text style={[styles.time, { color: c.textMuted }]}>
                      {formatNotifTime(item.createdAt)}
                    </Text>
                  </View>

                  {!item.read && <View style={[styles.dot, { backgroundColor: c.primary }]} />}

                  {blurred && !isPremium && (
                    <View style={[styles.lockBadge, { backgroundColor: c.primary }]}>
                      <Ionicons name="lock-closed" size={10} color="#fff" />
                    </View>
                  )}
                </Pressable>
                <Pressable onPress={() => deleteNotification(item.id)} hitSlop={8} style={styles.notifDeleteBtn}>
                  <Ionicons name="close" size={16} color={c.textMuted} />
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={40} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>{t("notif_empty")}</Text>
            </View>
          }
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    maxHeight: "75%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 18,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  readAllBtn: { padding: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  unreadPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  list: { paddingBottom: 8 },
  sep: { height: 1, marginHorizontal: 14 },
  item: { flexDirection: "row", alignItems: "center", padding: 12, paddingHorizontal: 14, gap: 12 },
  itemRow: { flexDirection: "row", alignItems: "center" },
  notifDeleteBtn: { paddingHorizontal: 12, paddingVertical: 8, alignSelf: "stretch", justifyContent: "center" },
  avatarWrap: { width: 44, height: 44, position: "relative" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  typeBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  lineRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  userName: { fontSize: 14, fontWeight: "700", maxWidth: "60%" },
  action: { fontSize: 13, fontWeight: "500", flex: 1 },
  msgPreview: { fontSize: 12, fontWeight: "400", marginTop: 1 },
  time: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  lockBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", padding: 40, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: "600" },
});
