import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

type Props = {
  message?: string;
  endDate?: string | null;
};

function formatEndDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();

  if (diffMs <= 0) return "Çok yakında";

  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const dateFormatted = d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFormatted = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let relative = "";
  if (diffDay > 0) {
    relative = `(${diffDay} gün ${diffHour % 24} saat sonra)`;
  } else if (diffHour > 0) {
    relative = `(${diffHour} saat ${diffMin % 60} dakika sonra)`;
  } else {
    relative = `(${diffMin} dakika sonra)`;
  }

  return `${dateFormatted} ${timeFormatted}\n${relative}`;
}

// Animated gear icon
function AnimatedGear() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text style={[{ fontSize: 64 }, style]}>⚙️</Animated.Text>
  );
}

// Animated dots
function PulsingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          marginHorizontal: 4,
        },
        style,
      ]}
    />
  );
}

export default function MaintenanceScreen({ message, endDate }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <AnimatedGear />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: c.text }]}>Bakımdayız</Text>

        {/* Dots */}
        <View style={styles.dotsRow}>
          <PulsingDot delay={0} color={c.primary} />
          <PulsingDot delay={200} color={c.primary} />
          <PulsingDot delay={400} color={c.primary} />
        </View>

        {/* Message */}
        <Text style={[styles.message, { color: c.textMuted }]}>
          {message || "Uygulamamızı sizin için geliştiriyoruz.\nKısa süre içinde geri döneceğiz!"}
        </Text>

        {/* End date */}
        {endDate ? (
          <View style={[styles.dateCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.dateLabel, { color: c.primary }]}>Tahmini Açılış</Text>
            <Text style={[styles.dateValue, { color: c.text }]}>{formatEndDate(endDate)}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.text }]}>💕 EşleşBuluş</Text>
          <Text style={[styles.footerSub, { color: c.textMuted }]}>Anlayışınız için teşekkür ederiz</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 12,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  dateCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 40,
    width: width - 64,
  },
  dateLabel: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  dateValue: {
    fontSize: 17,
    color: "#e2e8f0",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 26,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 13,
    color: "#64748b",
  },
});
