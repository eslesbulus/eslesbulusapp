import { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gift } from "@/constants/gifts";

const { width: W, height: H } = Dimensions.get("window");

type Props = {
  gift: Gift;
  onDone: () => void;
};

export function GiftAnimation({ gift, onDone }: Props) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(120);
  const rotate = useSharedValue(0);
  const glow = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    // Big entrance, hover, then float up & fade
    scale.value = withSequence(
      withSpring(1.6, { damping: 8, stiffness: 110 }),
      withDelay(400, withTiming(1.2, { duration: 200 })),
      withDelay(900, withTiming(0.4, { duration: 600, easing: Easing.in(Easing.cubic) }))
    );
    translateY.value = withSequence(
      withSpring(0, { damping: 12, stiffness: 120 }),
      withDelay(1300, withTiming(-H * 0.5, { duration: 600, easing: Easing.in(Easing.cubic) }))
    );
    rotate.value = withSequence(
      withTiming(-15, { duration: 250 }),
      withTiming(15, { duration: 250 }),
      withTiming(-8, { duration: 250 }),
      withTiming(0, { duration: 250 })
    );
    glow.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(900, withTiming(0, { duration: 600 }))
    );
    fade.value = withDelay(
      1700,
      withTiming(0, { duration: 250 }, (done) => {
        if (done) runOnJS(onDone)();
      })
    );
  }, []);

  const giftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: fade.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.7,
    transform: [{ scale: 1 + glow.value * 0.3 }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fade.value * 0.65,
  }));

  // Particles
  const particles = gift.particles ?? ["✨", "✨", "✨", "✨"];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dark overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle, { backgroundColor: "#000" }]} />

      {/* Center stage */}
      <View style={styles.center}>
        {/* Glow */}
        <Animated.View style={[styles.glowWrap, glowStyle]}>
          <LinearGradient
            colors={[gift.color, "transparent"]}
            style={styles.glow}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Particles */}
        {particles.map((p, i) => (
          <Particle key={i} emoji={p} index={i} total={particles.length} />
        ))}

        {/* Main gift */}
        <Animated.View style={[styles.giftWrap, giftStyle]}>
          <Text style={styles.giftEmoji}>{gift.emoji}</Text>
          <Text style={styles.giftName}>{gift.name}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function Particle({ emoji, index, total }: { emoji: string; index: number; total: number }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  const sc = useSharedValue(0);

  useEffect(() => {
    const angle = (index / total) * Math.PI * 2;
    const distance = 130 + Math.random() * 50;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    op.value = withSequence(
      withDelay(200, withTiming(1, { duration: 180 })),
      withDelay(800, withTiming(0, { duration: 400 }))
    );
    sc.value = withSequence(
      withDelay(200, withSpring(1, { damping: 10, stiffness: 130 })),
      withDelay(800, withTiming(0.5, { duration: 400 }))
    );
    tx.value = withDelay(200, withTiming(targetX, { duration: 900, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(200, withTiming(targetY, { duration: 900, easing: Easing.out(Easing.cubic) }));
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
  giftEmoji: { fontSize: 130, textShadowColor: "rgba(255,255,255,0.4)", textShadowRadius: 30 },
  giftName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 8,
  },
  glowWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  glow: {
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  particle: { position: "absolute" },
  particleText: { fontSize: 32 },
});
