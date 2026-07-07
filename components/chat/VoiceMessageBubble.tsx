import { memo, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image, GestureResponderEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Mesaj id'sinden deterministik dalga yükseklikleri üret
function makeBars(seed: string, n = 30): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = (Math.imul(h, 1103515245) + 12345) & 0x7fffffff;
    out.push(0.28 + (h % 1000) / 1000 * 0.72); // 0.28..1.0
  }
  return out;
}

export const VoiceMessageBubble = memo(function VoiceMessageBubble({
  id,
  url,
  durationMillis,
  fromMe,
  colors: c,
  avatar,
  timeStr,
  statusIcon,
}: {
  id: string;
  url: string;
  durationMillis: number;
  fromMe: boolean;
  colors: any;
  avatar?: string | null;
  timeStr: string;
  statusIcon?: React.ReactNode;
}) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  const [barW, setBarW] = useState(0);

  const totalSec = useMemo(() => {
    const known = durationMillis ? durationMillis / 1000 : 0;
    if (known > 0.3) return known;
    return status.duration && isFinite(status.duration) ? status.duration : 0;
  }, [durationMillis, status.duration]);

  const curSec = status.currentTime && isFinite(status.currentTime) ? status.currentTime : 0;
  const fraction = totalSec > 0 ? Math.min(curSec / totalSec, 1) : 0;
  const playing = status.playing;

  const bars = useMemo(() => makeBars(id, 30), [id]);

  // Bittiğinde başa sar
  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
      player.pause();
    }
  }, [status.didJustFinish]);

  const toggle = () => {
    if (playing) {
      player.pause();
    } else {
      if (totalSec > 0 && curSec >= totalSec - 0.08) player.seekTo(0);
      player.play();
    }
  };

  const seekFromTouch = (e: GestureResponderEvent) => {
    if (barW <= 0 || totalSec <= 0) return;
    const x = e.nativeEvent.locationX;
    const f = Math.max(0, Math.min(x / barW, 1));
    player.seekTo(f * totalSec);
  };

  const accent = fromMe ? "#fff" : c.primary;
  const inactive = fromMe ? "rgba(255,255,255,0.4)" : c.textMuted;
  const bg = fromMe ? c.primary : c.surface;
  const txtColor = fromMe ? "#fff" : c.text;
  const subColor = fromMe ? "rgba(255,255,255,0.7)" : c.textMuted;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: bg, alignSelf: fromMe ? "flex-end" : "flex-start" },
        fromMe ? styles.wrapMe : styles.wrapOther,
      ]}
    >
      <View style={styles.row}>
        {/* Avatar + mic rozet (sadece karşı taraf) */}
        {!fromMe && avatar ? (
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={[styles.micBadge, { backgroundColor: c.primary }]}>
              <Ionicons name="mic" size={10} color="#fff" />
            </View>
          </View>
        ) : null}

        {/* Play / Pause */}
        <Pressable onPress={toggle} hitSlop={8} style={[styles.playBtn, { backgroundColor: fromMe ? "rgba(255,255,255,0.22)" : c.primary }]}>
          <Ionicons name={playing ? "pause" : "play"} size={20} color="#fff" style={!playing && { marginLeft: 2 }} />
        </Pressable>

        {/* Dalga formu */}
        <Pressable
          style={styles.waveWrap}
          onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
          onPress={seekFromTouch}
        >
          {bars.map((bh, i) => {
            const played = i / bars.length <= fraction;
            return (
              <View
                key={i}
                style={{
                  width: 2.5,
                  height: Math.max(4, bh * 22),
                  borderRadius: 2,
                  backgroundColor: played ? accent : inactive,
                }}
              />
            );
          })}
        </Pressable>
      </View>

      {/* Süre + saat */}
      <View style={styles.meta}>
        <Text style={[styles.dur, { color: subColor }]}>
          {fmt(playing || curSec > 0 ? curSec : totalSec)}
        </Text>
        <View style={styles.metaRight}>
          <Text style={[styles.time, { color: subColor }]}>{timeStr}</Text>
          {statusIcon}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    maxWidth: "82%",
    minWidth: 220,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 5,
    marginHorizontal: 4,
  },
  wrapMe: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
  },
  wrapOther: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarWrap: { position: "relative", marginRight: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  micBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  waveWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 26,
    gap: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
    marginLeft: 46,
  },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 3 },
  dur: { fontSize: 11, fontWeight: "600", fontVariant: ["tabular-nums"] },
  time: { fontSize: 10.5 },
});
