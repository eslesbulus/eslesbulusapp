import { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Gift } from "@/constants/gifts";

const { height: H } = Dimensions.get("window");

// Convert "#RRGGBB" → "rgba(r, g, b, a)" with given alpha.
// Safer than hex+alpha string on some Android variants.
function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const safe = m.length === 6 ? m : "888888";
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Props = {
  gift: Gift;
  onDone: () => void;
};

export function GiftAnimation({ gift, onDone }: Props) {
  const scale = useSharedValue(0);
  const ty = useSharedValue(60);
  const rotate = useSharedValue(0);
  const glow = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.35, { damping: 9, stiffness: 110 });
    ty.value = withSpring(0, { damping: 12, stiffness: 120 });
    rotate.value = withTiming(-8, { duration: 320, easing: Easing.inOut(Easing.ease) });
    glow.value = withTiming(1, { duration: 280 });

    const settle = setTimeout(() => {
      rotate.value = withTiming(8, { duration: 280 });
    }, 320);

    const settle2 = setTimeout(() => {
      rotate.value = withTiming(0, { duration: 240 });
    }, 600);

    const exit = setTimeout(() => {
      scale.value = withTiming(0.5, { duration: 500, easing: Easing.in(Easing.cubic) });
      ty.value = withTiming(-H * 0.45, { duration: 500, easing: Easing.in(Easing.cubic) });
      glow.value = withTiming(0, { duration: 400 });
      fade.value = withTiming(0, { duration: 500 }, (done) => {
        if (done) runOnJS(onDone)();
      });
    }, 1400);

    return () => {
      clearTimeout(settle);
      clearTimeout(settle2);
      clearTimeout(exit);
      cancelAnimation(scale);
      cancelAnimation(ty);
      cancelAnimation(rotate);
      cancelAnimation(glow);
      cancelAnimation(fade);
    };
  }, []);

  const giftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: ty.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: fade.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.45,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fade.value * 0.55,
  }));

  const particles = (gift.particles ?? ["✨", "✨", "✨", "✨"]).slice(0, 4);
  const glowColor = hexToRgba(gift.color, 1);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle, { backgroundColor: "#000" }]} />

      <View style={styles.center}>
        {/* Solid color glow disc (no LinearGradient — was crashing on Android) */}
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            { backgroundColor: glowColor },
          ]}
        />

        {particles.map((p, i) => (
          <Particle key={i} emoji={p} index={i} total={particles.length} />
        ))}

        <Animated.View style={[styles.giftWrap, giftStyle]}>
          <Text style={styles.giftEmoji}>{gift.emoji}</Text>
          <Text style={styles.giftName}>{gift.name}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function Particle({
  emoji,
  index,
  total,
}: {
  emoji: string;
  index: number;
  total: number;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  const sc = useSharedValue(0);

  useEffect(() => {
    const safeTotal = Math.max(total, 1);
    const angle = (index / safeTotal) * Math.PI * 2;
    const distance = 140;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;
    const delay = 220 + index * 40;

    op.value = withDelay(delay, withTiming(1, { duration: 180 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 11, stiffness: 130 }));
    tx.value = withDelay(delay, withTiming(targetX, { duration: 800, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withTiming(targetY, { duration: 800, easing: Easing.out(Easing.cubic) }));

    const fadeOut = setTimeout(() => {
      op.value = withTiming(0, { duration: 350 });
      sc.value = withTiming(0.5, { duration: 350 });
    }, delay + 700);

    return () => {
      clearTimeout(fadeOut);
      cancelAnimation(tx);
      cancelAnimation(ty);
      cancelAnimation(op);
      cancelAnimation(sc);
    };
  }, []);

  const pStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: sc.value },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, pStyle]}>
      <Text style={styles.particleText}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  giftWrap: { alignItems: "center" },
  giftEmoji: {
    fontSize: 120,
    textShadowColor: "rgba(255,255,255,0.4)",
    textShadowRadius: 24,
  },
  giftName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 8,
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  particle: { position: "absolute" },
  particleText: { fontSize: 28 },
});
