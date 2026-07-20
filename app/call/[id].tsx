import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const { width: W, height: H } = Dimensions.get("window");

export default function CallScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: userLoading } = useUser(id);
  const { profile } = useAuth();
  const { t } = useLanguage();
  const userPhoto = user?.photoURL || user?.photos?.[0] || "";
  const myPhoto = profile?.photoURL || profile?.photos?.[0] || "";
  const userName = user?.name ?? "";
  const isVideo = type === "video";

  const [callState, setCallState] = useState<"ringing" | "connected">("ringing");
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-connect after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setCallState("connected"), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Ring pulse animation
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse1Op = useSharedValue(0.6);
  const pulse2Op = useSharedValue(0.4);

  useEffect(() => {
    if (callState === "ringing") {
      pulse1.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
      pulse1Op.value = withRepeat(
        withSequence(withTiming(0, { duration: 1000 }), withTiming(0.6, { duration: 0 })),
        -1,
        false
      );
      pulse2.value = withRepeat(
        withDelay(
          300,
          withSequence(
            withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 0 })
          )
        ),
        -1,
        false
      );
      pulse2Op.value = withRepeat(
        withDelay(300, withSequence(withTiming(0, { duration: 1000 }), withTiming(0.4, { duration: 0 }))),
        -1,
        false
      );
    }
  }, [callState]);

  const p1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: pulse1Op.value,
  }));
  const p2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: pulse2Op.value,
  }));

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  function handleEnd() {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  }

  // Defer navigation to effect to avoid setState-during-render
  useEffect(() => {
    if (!user && !userLoading) router.back();
  }, [user, userLoading]);

  if (!user) {
    return null;
  }

  // ─── VIDEO CALL ───────────────────────────────────────────────────
  if (isVideo) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Remote "video" feed — user's photo as bg */}
        <Image
          source={{ uri: userPhoto }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <BlurView
          intensity={cameraOff ? 90 : 10}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]} />

        {/* Top bar */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.videoTop, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.videoName}>{userName}</Text>
          <Text style={styles.videoStatus}>
            {callState === "ringing" ? t("call_calling") : formatDuration(duration)}
          </Text>
          {callState === "connected" && (
            <View style={styles.videoBadge}>
              <View style={styles.videoLiveDot} />
              <Text style={styles.videoBadgeText}>{t("call_live")}</Text>
            </View>
          )}
        </Animated.View>

        {/* Self preview */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={[styles.selfPreview, { bottom: insets.bottom + 160, right: 16 }]}
        >
          <Image
            source={{ uri: myPhoto || "https://via.placeholder.com/200" }}
            style={styles.selfPreviewImg}
          />
          {cameraOff && (
            <View style={styles.camOffLayer}>
              <Ionicons name="videocam-off" size={20} color="#fff" />
            </View>
          )}
        </Animated.View>

        {/* Controls */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[styles.controls, { paddingBottom: insets.bottom + 28 }]}
        >
          <CtrlBtn
            icon={muted ? "mic-off" : "mic"}
            label={muted ? t("call_muted") : t("call_microphone")}
            onPress={() => setMuted(!muted)}
            active={!muted}
          />
          <CtrlBtn
            icon={cameraOff ? "videocam-off" : "videocam"}
            label={cameraOff ? t("call_camera_off") : t("call_camera")}
            onPress={() => setCameraOff(!cameraOff)}
            active={!cameraOff}
          />
          <CtrlBtn
            icon="camera-reverse-outline"
            label={t("call_flip")}
            onPress={() => {}}
            active
          />
          <EndBtn label={t("call_end")} onPress={handleEnd} />
        </Animated.View>
      </View>
    );
  }

  // ─── VOICE CALL ───────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Avatar + pulse rings */}
      <Animated.View
        entering={FadeIn.duration(500)}
        style={[styles.voiceCenter, { paddingTop: insets.top }]}
      >
        {/* Rings ve avatar aynı container içinde hizalanıyor */}
        <View style={styles.avatarPulseContainer}>
          {callState === "ringing" && (
            <>
              <Animated.View style={[styles.pulseRing, p1Style, { borderColor: "rgba(255,255,255,0.2)" }]} />
              <Animated.View style={[styles.pulseRingOuter, p2Style, { borderColor: "rgba(255,255,255,0.15)" }]} />
            </>
          )}
          <Image source={{ uri: userPhoto }} style={styles.voiceAvatar} />
        </View>

        <Text style={styles.voiceName}>{userName}</Text>
        <Text style={styles.voiceStatus}>
          {callState === "ringing"
            ? t("call_calling")
            : t("call_connected_duration", { duration: formatDuration(duration) })}
        </Text>
        {callState === "connected" && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.connectedBadge}>
            <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={styles.connectedText}>{t("call_encrypted")}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Controls */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(400)}
        style={[styles.controls, { paddingBottom: insets.bottom + 28 }]}
      >
        <CtrlBtn
          icon={muted ? "mic-off" : "mic"}
          label={muted ? t("call_muted") : t("call_microphone")}
          onPress={() => setMuted(!muted)}
          active={!muted}
        />
        <CtrlBtn
          icon={speakerOn ? "volume-high" : "volume-medium-outline"}
          label={t("call_speaker")}
          onPress={() => setSpeakerOn(!speakerOn)}
          active={speakerOn}
        />
        <CtrlBtn
          icon="chatbubble-outline"
          label={t("call_message")}
          onPress={() => router.back()}
          active={false}
        />
        <EndBtn label={t("call_end")} onPress={handleEnd} />
      </Animated.View>
    </View>
  );
}

// ─── Sub components ────────────────────────────────────────────────

function CtrlBtn({
  icon,
  label,
  onPress,
  active,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  active: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.ctrlItem}>
      <View
        style={[
          styles.ctrlBtn,
          { backgroundColor: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)" },
        ]}
      >
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </Pressable>
  );
}

function EndBtn({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.ctrlItem}>
      <View style={styles.endBtn}>
        <Ionicons
          name="call"
          size={26}
          color="#fff"
          style={{ transform: [{ rotate: "135deg" }] }}
        />
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Video top
  videoTop: {
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 1,
    gap: 6,
  },
  videoName: { fontSize: 26, fontWeight: "700", color: "#fff" },
  videoStatus: { fontSize: 14, color: "rgba(255,255,255,0.75)" },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  videoBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 1 },

  // Self preview
  selfPreview: {
    position: "absolute",
    width: 100,
    height: 144,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    zIndex: 2,
  },
  selfPreviewImg: { width: "100%", height: "100%" },
  camOffLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Voice
  voiceCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  // Rings ve avatar'ı tam üst üste hizalayan container
  avatarPulseContainer: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 30,
    top: 30,   // (240 - 180) / 2
    left: 30,
  },
  pulseRingOuter: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 24,
    top: 0,
    left: 0,
  },
  voiceAvatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.35)",
  },
  voiceName: { fontSize: 28, fontWeight: "700", color: "#fff" },
  voiceStatus: { fontSize: 15, color: "rgba(255,255,255,0.72)" },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  connectedText: { fontSize: 12, color: "rgba(255,255,255,0.55)" },

  // Controls (shared)
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 20,
  },
  ctrlItem: { alignItems: "center", gap: 8, flex: 1 },
  ctrlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlLabel: { fontSize: 11, color: "rgba(255,255,255,0.65)", textAlign: "center" },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
});
