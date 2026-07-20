import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  show: boolean;
  userName?: string;
  userPhoto?: string;
  message?: string;
  emoji?: string;
  topInset?: number;
};

export function SentToast({ show, userName, userPhoto, message, emoji, topInset = 0 }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const c = theme.colors;
  const y = useSharedValue(-140);
  const op = useSharedValue(0);

  useEffect(() => {
    if (show) {
      op.value = withTiming(1, { duration: 180 });
      y.value = withSequence(
        withTiming(0, { duration: 280 }),
        withDelay(2200, withTiming(-140, { duration: 250 }))
      );
      op.value = withSequence(
        withTiming(1, { duration: 180 }),
        withDelay(2300, withTiming(0, { duration: 200 }))
      );
    }
  }, [show, message]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: op.value,
  }));

  if (!userName) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        style,
        {
          top: topInset + 8,
          backgroundColor: c.surface,
          borderColor: c.border,
          shadowColor: "#000",
        },
      ]}
    >
      <Image source={{ uri: userPhoto }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Ionicons name="checkmark-circle" size={14} color={c.online} />
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
            {t("sent_toast_title", { name: userName })}
          </Text>
        </View>
        <Text style={[styles.msg, { color: c.textMuted }]} numberOfLines={1}>
          {emoji} {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 12,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 999,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  title: { fontSize: 13, fontWeight: "700" },
  msg: { fontSize: 12, marginTop: 2 },
});
