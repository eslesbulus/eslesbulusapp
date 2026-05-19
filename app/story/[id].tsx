import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { STORY_USERS, MockUser } from "@/constants/mockUsers";
import { StoryProgressBar } from "@/components/story/StoryProgressBar";
import { StoryReactions } from "@/components/story/StoryReactions";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const DURATION = 5000;
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

function getStoryMedia(u: MockUser): string[] {
  return u.photos.slice(0, 3);
}

function timeAgo(_u: MockUser): string {
  return _u.online ? "az önce" : _u.lastActive ?? "bugün";
}

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const initialIdx = useMemo(() => {
    const i = STORY_USERS.findIndex((u) => u.id === id);
    return i >= 0 ? i : 0;
  }, [id]);

  const [userIdx, setUserIdx] = useState(initialIdx);
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inputActive, setInputActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const user = STORY_USERS[userIdx];
  const media = useMemo(() => getStoryMedia(user), [user]);
  const totalSlides = media.length;

  const progress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  const close = useCallback(() => router.back(), [router]);

  const advance = useCallback(() => {
    if (slideIdx < totalSlides - 1) {
      setSlideIdx((i) => i + 1);
    } else if (userIdx < STORY_USERS.length - 1) {
      slideOutTo("left");
    } else {
      close();
    }
  }, [slideIdx, totalSlides, userIdx, close]);

  const back = useCallback(() => {
    if (slideIdx > 0) {
      setSlideIdx((i) => i - 1);
    } else if (userIdx > 0) {
      slideOutTo("right");
    }
  }, [slideIdx, userIdx]);

  function slideOutTo(dir: "left" | "right") {
    const to = dir === "left" ? -SCREEN_W * 0.3 : SCREEN_W * 0.3;
    translateX.value = withTiming(to, { duration: 240, easing: EASE });
    contentOpacity.value = withTiming(0, { duration: 240, easing: EASE }, (finished) => {
      if (!finished) return;
      runOnJS(commitUserChange)(dir);
    });
  }

  function commitUserChange(dir: "left" | "right") {
    if (dir === "left") {
      setUserIdx((i) => Math.min(i + 1, STORY_USERS.length - 1));
      setSlideIdx(0);
    } else {
      setUserIdx((i) => {
        const next = Math.max(i - 1, 0);
        return next;
      });
      setSlideIdx(0);
    }
  }

  // userIdx değişince translateX'i sıfırla ve içeriği fade-in et
  useEffect(() => {
    translateX.value = 0;
    contentOpacity.value = withTiming(1, { duration: 260, easing: EASE });
  }, [userIdx]);

  // Slide veya user değişince progress'i sıfırla, paused değilse oynat
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (paused || inputActive) return;
    progress.value = withTiming(1, { duration: DURATION, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(advance)();
    });
  }, [slideIdx, userIdx]);

  // Pause/resume
  useEffect(() => {
    if (paused || inputActive) {
      cancelAnimation(progress);
    } else {
      const remaining = (1 - progress.value) * DURATION;
      progress.value = withTiming(
        1,
        { duration: Math.max(remaining, 200), easing: Easing.linear },
        (finished) => {
          if (finished) runOnJS(advance)();
        }
      );
    }
  }, [paused, inputActive]);

  // Pan: yatay → user değiştir, dikey aşağı → kapat
  // 0=undecided, 1=horizontal, 2=vertical
  const panDir = useSharedValue<0 | 1 | 2>(0);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);

  const pan = Gesture.Pan()
    .minDistance(8)
    .onBegin(() => {
      "worklet";
      panDir.value = 0;
      panX.value = 0;
      panY.value = 0;
    })
    .onUpdate((e) => {
      "worklet";
      if (panDir.value === 0) {
        const absX = Math.abs(e.translationX);
        const absY = Math.abs(e.translationY);
        if (absX > 12 || absY > 12) {
          panDir.value = absX >= absY ? 1 : 2;
        }
      }
      if (panDir.value === 1) {
        panX.value = e.translationX;
        panY.value = 0;
      } else if (panDir.value === 2) {
        panX.value = 0;
        panY.value = Math.max(e.translationY, 0);
      }
    })
    .onEnd((e) => {
      "worklet";
      if (panDir.value === 2) {
        if (e.translationY > 120 || e.velocityY > 1200) {
          runOnJS(close)();
          return;
        }
        panX.value = withTiming(0, { duration: 220, easing: EASE });
        panY.value = withTiming(0, { duration: 220, easing: EASE });
        return;
      }

      const goNext = e.translationX < -SCREEN_W * 0.22 || e.velocityX < -700;
      const goPrev = e.translationX > SCREEN_W * 0.22 || e.velocityX > 700;

      // Programatik geçişten önce pan değerlerini sıfırla
      panX.value = 0;
      panY.value = 0;

      if (goNext && userIdx < STORY_USERS.length - 1) {
        runOnJS(slideOutTo)("left");
      } else if (goPrev && userIdx > 0) {
        runOnJS(slideOutTo)("right");
      } else {
        panX.value = withTiming(0, { duration: 220, easing: EASE });
        panY.value = withTiming(0, { duration: 220, easing: EASE });
      }
    });

  const animatedContainer = useAnimatedStyle(() => ({
    transform: [
      { translateX: panX.value + translateX.value },
      { translateY: panY.value },
      { scale: 1 - Math.min(panY.value, 200) / 1000 },
    ],
    opacity: contentOpacity.value * (1 - Math.min(panY.value, 200) / 500),
  }));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1400);
  }

  function handleSend(kind: "emoji" | "message", payload: string) {
    if (kind === "emoji") {
      showToast(`${payload} gönderildi`);
    } else {
      showToast(`Mesaj gönderildi`);
    }
  }

  function handleTapLeft() {
    back();
  }

  function handleTapRight() {
    advance();
  }

  if (!user) {
    close();
    return null;
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.canvas, animatedContainer]}>
          <Image
            source={{ uri: media[slideIdx] }}
            style={styles.media}
            resizeMode="cover"
          />

          {/* Top gradient */}
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "transparent"]}
            style={styles.topShadow}
            pointerEvents="none"
          />

          {/* Bottom gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={styles.bottomShadow}
            pointerEvents="none"
          />

          {/* Top: progress + header */}
          <View style={[styles.topArea, { paddingTop: insets.top + 4 }]}>
            <StoryProgressBar
              count={totalSlides}
              currentIndex={slideIdx}
              progress={progress}
            />
            <View style={styles.userHeader}>
              <Image source={{ uri: user.photo }} style={styles.userAvatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.userRow}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.name}
                  </Text>
                  {user.verified && <VerifiedBadge size={13} />}
                  <Text style={styles.userTime}>· {timeAgo(user)}</Text>
                </View>
              </View>
              {paused && (
                <View style={styles.pausePill}>
                  <Ionicons name="pause" size={11} color="#fff" />
                  <Text style={styles.pauseText}>Duraklatıldı</Text>
                </View>
              )}
              <Pressable onPress={close} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Tap zones — orta alan */}
          <View style={styles.tapRow} pointerEvents="box-none">
            <Pressable
              style={styles.tapLeft}
              onPress={handleTapLeft}
              onLongPress={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
              delayLongPress={200}
            />
            <Pressable
              style={styles.tapRight}
              onPress={handleTapRight}
              onLongPress={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
              delayLongPress={200}
            />
          </View>

          {toast && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[
          styles.reactions,
          { paddingBottom: insets.bottom + 10 },
        ]}
        pointerEvents="box-none"
      >
        <StoryReactions
          userName={user.name}
          onSend={handleSend}
          onFocusInput={() => setInputActive(true)}
          onBlurInput={() => setInputActive(false)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  canvas: { flex: 1, overflow: "hidden" },
  media: {
    width: SCREEN_W,
    height: SCREEN_H,
    position: "absolute",
  },
  topShadow: { position: "absolute", left: 0, right: 0, top: 0, height: 160 },
  bottomShadow: { position: "absolute", left: 0, right: 0, bottom: 0, height: 220 },

  topArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 5,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  userName: { color: "#fff", fontSize: 14, fontWeight: "800" },
  userTime: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" },
  pausePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pauseText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  closeBtn: { padding: 4 },

  tapRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 100,
    bottom: 180,
    flexDirection: "row",
  },
  tapLeft: { width: "30%", height: "100%" },
  tapRight: { flex: 1, height: "100%" },

  reactions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },

  toast: {
    position: "absolute",
    top: "45%",
    left: 40,
    right: 40,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
