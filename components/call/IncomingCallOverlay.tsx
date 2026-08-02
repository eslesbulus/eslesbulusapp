import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Image, Pressable, StyleSheet, Modal, Vibration, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSocket } from "@/config/socket";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePremium } from "@/context/PremiumContext";

type IncomingCall = {
  callId: string;
  chatKey: string;
  type: "voice" | "video";
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  fake?: boolean;
};

/** Zil 30 sn sonra kendiliginden susar — sonsuza kadar calmasin. */
const RING_TIMEOUT = 30000;

/**
 * Gelen arama ekrani. Uygulama genelinde tek bir yerde durur (_layout),
 * boylece kullanici hangi sayfada olursa olsun aramayi gorur.
 *
 * VIP olmayan kullanici cevaplamaya calistiginda arama otomatik reddedilir
 * ve VIP yonlendirmesi gosterilir.
 */
export function IncomingCallOverlay() {
  const [call, setCall] = useState<IncomingCall | null>(null);
  const [rejected, setRejected] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { isPremium } = usePremium();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const dismiss = useCallback(() => {
    clearTimer();
    Vibration.cancel();
    setCall(null);
    setRejected(false);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (data: IncomingCall) => {
      if (!data || !data.callId) return;
      setRejected(false);
      setCall(data);
      // Titresim deseni — gercek arama hissi icin
      Vibration.vibrate([0, 600, 800], true);
      clearTimer();
      timerRef.current = setTimeout(() => dismiss(), RING_TIMEOUT);
    };

    socket.on("call:incoming", onIncoming);
    return () => {
      socket.off("call:incoming", onIncoming);
      clearTimer();
      Vibration.cancel();
    };
  }, [dismiss]);

  // Cagri ekrani kapandiginda titresim de dursun
  useEffect(() => {
    if (!call) Vibration.cancel();
  }, [call]);

  const answer = () => {
    Vibration.cancel();
    clearTimer();
    // VIP olmayan kullanici icin arama otomatik reddedilir.
    // (Sunucu zaten VIP kullaniciya sahte arama gondermiyor; bu kontrol
    //  arada VIP olmus kullanicilar icin guvenlik agi.)
    if (!isPremium) {
      setRejected(true);
      return;
    }
    dismiss();
  };

  // Zil animasyonu — avatar cevresinde nabiz
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!call || rejected) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );
  }, [call, rejected]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (!call) return null;

  const isVideo = call.type === "video";

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        {rejected ? (
          /* ── Reddedildi: VIP yonlendirmesi ── */
          <View style={styles.center}>
            <View style={styles.rejectIcon}>
              <Ionicons name="close" size={34} color="#fff" />
            </View>
            <Text style={styles.rejectTitle}>{t("call_rejected_title")}</Text>
            <Text style={styles.rejectDesc}>{t("call_rejected_desc")}</Text>

            <Pressable
              style={styles.vipBtn}
              onPress={() => { dismiss(); router.push("/premium"); }}
            >
              <Ionicons name="star" size={16} color="#000" />
              <Text style={styles.vipBtnText}>{t("matches_go_premium")}</Text>
            </Pressable>
            <Pressable style={styles.laterBtn} onPress={dismiss}>
              <Text style={styles.laterBtnText}>{t("common_cancel")}</Text>
            </Pressable>
          </View>
        ) : (
          /* ── Caliyor ── */
          <>
            <View style={styles.center}>
              <Text style={styles.callType}>
                {isVideo ? t("call_incoming_video") : t("call_incoming_voice")}
              </Text>

              <Animated.View style={[styles.avatarWrap, pulseStyle]}>
                {call.fromPhoto ? (
                  <Image source={{ uri: call.fromPhoto }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: c.surface }]} />
                )}
              </Animated.View>

              <Text style={styles.name}>{call.fromName || t("profile_user_fallback")}</Text>
              <Text style={styles.ringing}>{t("call_ringing")}</Text>
            </View>

            <View style={styles.actions}>
              <View style={styles.actionCol}>
                <Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={dismiss}>
                  <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
                </Pressable>
                <Text style={styles.actionLabel}>{t("call_decline")}</Text>
              </View>

              <View style={styles.actionCol}>
                <Pressable style={[styles.actionBtn, styles.answerBtn]} onPress={answer}>
                  <Ionicons name={isVideo ? "videocam" : "call"} size={28} color="#fff" />
                </Pressable>
                <Text style={styles.actionLabel}>{t("call_answer")}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(8,6,12,0.97)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },

  callType: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13.5,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginBottom: 22,
    textTransform: "uppercase",
  },
  avatarWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 4,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    marginBottom: 20,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 62 },
  name: { color: "#fff", fontSize: 25, fontWeight: "800" },
  ringing: { color: "rgba(255,255,255,0.55)", fontSize: 14, marginTop: 2 },

  actions: { flexDirection: "row", gap: 66 },
  actionCol: { alignItems: "center", gap: 10 },
  actionBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: { backgroundColor: "#EF4444" },
  answerBtn: { backgroundColor: "#22C55E" },
  actionLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" },

  rejectIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  rejectTitle: { color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" },
  rejectDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 26,
    paddingHorizontal: 6,
  },
  vipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 16,
  },
  vipBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },
  laterBtn: { marginTop: 14, padding: 10 },
  laterBtnText: { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "600" },
});
