import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Dimensions, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { MockUser } from "@/constants/mockUsers";
import { useInteractions } from "@/context/InteractionsContext";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { usePremium, DAILY_LIKE_LIMIT } from "@/context/PremiumContext";

type Props = {
  user: MockUser;
  onPressHi: (user: MockUser) => void;
  onPress?: (user: MockUser) => void;
};

const SCREEN = Dimensions.get("window").width;
const GAP = 12;
const CARD_W = (SCREEN - 16 * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.45;

export function ProfileCardAlbum({ user, onPressHi, onPress }: Props) {
  const { theme } = useTheme();
  const { hasSent, isLiked, toggleLike } = useInteractions();
  const { canLike, useLike } = usePremium();
  const router = useRouter();
  const c = theme.colors;
  const sent = hasSent(user.id);
  const liked = isLiked(user.id);

  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const justSent = useSharedValue(0);

  useEffect(() => {
    if (sent) {
      justSent.value = withSequence(
        withTiming(1, { duration: 250 }),
        withTiming(1, { duration: 1200 })
      );
    }
  }, [sent]);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const heartAnim = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  async function handleLike() {
    if (!canLike && !liked) {
      Alert.alert(
        "Günlük Limit Doldu",
        `Bugün ${DAILY_LIKE_LIMIT} beğeni hakkını kullandın. Premium üyelikle sınırsız beğen!`,
        [
          { text: "İptal", style: "cancel" },
          { text: "Premium Al 👑", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    heartScale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withSpring(1.3, { damping: 5, stiffness: 300 }),
      withSpring(1, { damping: 10 })
    );
    if (!liked) {
      const allowed = await useLike();
      if (!allowed) return;
    }
    toggleLike(user);
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.card, opacity: pressed ? 0.95 : 1 },
      ]}
      onPress={() => onPress?.(user)}
    >
      <Image source={{ uri: user.photo }} style={styles.photo} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.gradient}
      />

      {user.vip && (
        <View style={[styles.vipBadge, { backgroundColor: c.secondary }]}>
          <Ionicons name="diamond" size={9} color="#fff" />
          <Text style={styles.vipText}>VIP</Text>
        </View>
      )}

      <View style={styles.statusRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: user.online ? c.online : c.textMuted },
          ]}
        />
        <Text style={styles.statusText}>
          {user.online ? "Çevrimiçi" : user.lastActive ?? "Çevrimdışı"}
        </Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}, {user.age}
          </Text>
          {user.verified && <VerifiedBadge size={13} />}
          <Pressable onPress={handleLike} hitSlop={8} style={styles.heartBtn}>
            <Animated.View style={heartAnim}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={17}
                color={liked ? "#FF4D6D" : "rgba(255,255,255,0.9)"}
              />
            </Animated.View>
          </Pressable>
        </View>
        <View style={styles.cityRow}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
          <Text style={styles.city} numberOfLines={1}>
            {user.city}
          </Text>
        </View>

        <Animated.View style={btnStyle}>
          <Pressable
            onPress={() => {
              if (sent) return;
              scale.value = withSequence(
                withTiming(0.92, { duration: 90 }),
                withSpring(1, { damping: 8 })
              );
              onPressHi(user);
            }}
            disabled={sent}
            style={[
              styles.hiBtn,
              sent
                ? { backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" }
                : { backgroundColor: c.primary },
            ]}
          >
            {sent ? (
              <>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.hiText}>Gönderildi</Text>
              </>
            ) : (
              <Text style={styles.hiText}>Hi 👋</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
  },
  vipBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  vipText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  statusRow: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  info: { position: "absolute", left: 10, right: 10, bottom: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  heartBtn: {
    marginLeft: "auto",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  city: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  hiBtn: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  hiText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
