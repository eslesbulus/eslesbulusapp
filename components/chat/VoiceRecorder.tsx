import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";

const CANCEL_X = -100; // sola bu kadar kaydırınca iptal
const LOCK_Y = -80; // yukarı bu kadar kaydırınca kilitle
const MIN_MS = 800; // bu süreden kısa kayıtlar gönderilmez

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// İzole sayaç — her 200ms'de bir günceller, ana bileşeni (ve gesture'ı) re-render etmez
function RecordingTimer({ startTime, color }: { startTime: number; color: string }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    setMs(Date.now() - startTime);
    const t = setInterval(() => setMs(Date.now() - startTime), 200);
    return () => clearInterval(t);
  }, [startTime]);
  return <Text style={[styles.timer, { color }]}>{fmt(ms)}</Text>;
}

export function VoiceRecorder({
  colors: c,
  onSend,
}: {
  colors: any;
  onSend: (uri: string, durationMillis: number) => void;
}) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });

  const [recording, setRecording] = useState(false);
  const [locked, setLocked] = useState(false);

  const startedRef = useRef(false);     // record() gerçekten başladı mı
  const startingRef = useRef(false);    // beginRecording çalışıyor mu (re-entry guard)
  const cancelRef = useRef(false);      // iptal işaretlendi mi
  const lockedRef = useRef(false);
  const startTimeRef = useRef(0);       // kayıt başlangıç zamanı (ms)
  const pendingStopRef = useRef<null | { cancel: boolean }>(null);

  // Animasyon değerleri
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const lockShared = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    return () => {
      // unmount olursa kaydı durdur
      if (startedRef.current) {
        recorder.stop().catch(() => {});
      }
    };
  }, []);

  async function ensurePermission(): Promise<boolean> {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      showAlert("Mikrofon İzni", "Sesli mesaj göndermek için mikrofon iznine ihtiyaç var.");
    }
    return granted;
  }

  async function beginRecording() {
    // Aynı anda ikinci bir başlatmayı engelle (gesture birden fazla tetikleyebilir)
    if (startingRef.current || startedRef.current) return;
    startingRef.current = true;

    cancelRef.current = false;
    lockedRef.current = false;
    pendingStopRef.current = null;
    setLocked(false);

    const ok = await ensurePermission();
    if (!ok) {
      startingRef.current = false;
      resetAnim();
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      // Önceki oturum düzgün kapanmadıysa recorder "prepared" durumda kilitli kalır
      // ve prepareToRecordAsync "already prepared" hatası fırlatır. Her zaman temiz
      // başlamak için önce olası eski oturumu kapat (idle'da hata verirse yut).
      try { await recorder.stop(); } catch {}

      await recorder.prepareToRecordAsync();
      recorder.record();
      startedRef.current = true;
      startTimeRef.current = Date.now();
      setRecording(true);
      // Blink/pulse
      pulse.value = withRepeat(withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);

      // Hızlı bırakma — record() bitmeden parmak kalktıysa
      if (pendingStopRef.current) {
        const { cancel } = pendingStopRef.current;
        pendingStopRef.current = null;
        doStop(cancel);
      }
    } catch (e) {
      console.warn("record start error", e);
      startedRef.current = false;
      setRecording(false);
      resetAnim();
      // Recorder'ı serbest bırak ki sonraki denemeler kilitli kalmasın
      try { await recorder.stop(); } catch {}
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    } finally {
      startingRef.current = false;
    }
  }

  async function doStop(cancel: boolean) {
    if (!startedRef.current) {
      // henüz başlamadı — başlayınca dursun
      pendingStopRef.current = { cancel };
      return;
    }
    // Çift durdurmayı engelle: hemen başlatılmadı olarak işaretle
    startedRef.current = false;
    const durMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri ?? null;
    } catch (e) {
      console.warn("record stop error", e);
    }
    startedRef.current = false;
    setRecording(false);
    setLocked(false);
    lockedRef.current = false;
    lockShared.value = 0;
    resetAnim();
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

    if (cancel || !uri || durMs < MIN_MS) return;
    onSend(uri, durMs);
  }

  function resetAnim() {
    dragX.value = withSpring(0, { damping: 18, stiffness: 250 });
    dragY.value = withSpring(0, { damping: 18, stiffness: 250 });
  }

  function triggerLock() {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    dragX.value = withSpring(0);
    dragY.value = withSpring(0);
  }

  // JS tarafı bitiş — kilitli değilken parmak kalkınca
  function finishHold() {
    if (lockedRef.current) return; // kilitliyse devam
    doStop(cancelRef.current);
  }

  const pan = Gesture.Pan()
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      runOnJS(beginRecording)();
    })
    .onUpdate((e) => {
      if (lockShared.value === 1) return;
      const x = Math.min(0, e.translationX);
      const y = Math.min(0, e.translationY);
      dragX.value = x;
      dragY.value = y;
      // İptal
      if (x < CANCEL_X) {
        runOnJS(markCancel)();
      } else {
        runOnJS(unmarkCancel)();
      }
      // Kilit
      if (y < LOCK_Y) {
        lockShared.value = 1;
        runOnJS(triggerLock)();
      }
    })
    .onEnd(() => {
      if (lockShared.value === 1) return;
      runOnJS(finishHold)();
    })
    .onFinalize(() => {
      if (lockShared.value === 1) return;
      dragX.value = withSpring(0);
      dragY.value = withSpring(0);
    });

  const [cancelArmed, setCancelArmed] = useState(false);
  function markCancel() { cancelRef.current = true; setCancelArmed(true); }
  function unmarkCancel() { cancelRef.current = false; setCancelArmed(false); }

  // ── Animated styles ──
  const micFollowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }, { scale: 1 + Math.min(Math.abs(dragY.value) / 200, 0.4) }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const slideHintStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(Math.abs(dragX.value) / 120, 1),
    transform: [{ translateX: dragX.value * 0.5 }],
  }));
  const lockHintStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(Math.abs(dragY.value) / 100, 1),
    transform: [{ translateY: Math.max(dragY.value * 0.4, -30) }],
  }));

  return (
    <>
      {/* Mic tetikleyici buton */}
      <GestureDetector gesture={pan}>
        <View style={styles.micBtn} collapsable={false}>
          <Ionicons name="mic" size={26} color={c.primary} />
        </View>
      </GestureDetector>

      {/* Kayıt overlay — input bar'ı kaplar */}
      {recording && (
        <View
          style={[styles.overlay, { backgroundColor: c.card }]}
          pointerEvents={locked ? "auto" : "none"}
        >
          {/* Kilit ipucu (bar üstünde) */}
          {!locked && (
            <Animated.View style={[styles.lockHint, lockHintStyle]}>
              <View style={[styles.lockPill, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="lock-open-outline" size={16} color={c.textMuted} />
                <Ionicons name="chevron-up" size={14} color={c.textMuted} />
              </View>
            </Animated.View>
          )}

          {/* Sol: kırmızı nokta + süre */}
          <View style={styles.left}>
            <Animated.View style={[styles.recDot, pulseStyle]} />
            <RecordingTimer startTime={startTimeRef.current} color={c.text} />
          </View>

          {/* Orta: kaydırma ipucu veya kilitli durum */}
          {locked ? (
            <View style={styles.lockedRow}>
              <Pressable hitSlop={10} onPress={() => doStop(true)} style={styles.lockedBtn}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </Pressable>
              <View style={styles.lockedCenter}>
                <Ionicons name="lock-closed" size={14} color={c.primary} />
                <Text style={[styles.lockedText, { color: c.textMuted }]}>Kaydediliyor</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => doStop(false)} style={[styles.sendBtn, { backgroundColor: c.primary }]}>
                <Ionicons name="send" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Animated.View style={[styles.slideHint, slideHintStyle]}>
              <Ionicons name="chevron-back" size={18} color={cancelArmed ? "#EF4444" : c.textMuted} />
              <Text style={[styles.slideText, { color: cancelArmed ? "#EF4444" : c.textMuted }]}>
                {cancelArmed ? "Bırak ve iptal et" : "Kaydırarak iptal et"}
              </Text>
            </Animated.View>
          )}

          {/* Sağ: parmağı takip eden mic (kilitli değilken) */}
          {!locked && (
            <Animated.View style={[styles.followMic, { backgroundColor: c.primary }, micFollowStyle]}>
              <Ionicons name="mic" size={24} color="#fff" />
            </Animated.View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  micBtn: { padding: 6, paddingBottom: 8, alignItems: "center", justifyContent: "center" },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 76 },
  recDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#EF4444" },
  timer: { fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] },

  slideHint: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 },
  slideText: { fontSize: 13.5, fontWeight: "500" },

  followMic: {
    position: "absolute",
    right: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  lockHint: {
    position: "absolute",
    right: 18,
    top: -56,
    alignItems: "center",
  },
  lockPill: {
    width: 36,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },

  lockedRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lockedBtn: { padding: 6 },
  lockedCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  lockedText: { fontSize: 13, fontWeight: "500" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
