import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

export type ViewMode = "album" | "list";

type Props = {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
};

const W = 88;
const H = 36;

export function ViewToggle({ mode, onChange }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const x = useSharedValue(mode === "album" ? 0 : W / 2);

  useEffect(() => {
    x.value = withTiming(mode === "album" ? 0 : W / 2, { duration: 220 });
  }, [mode]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View style={[styles.wrap, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: c.primary },
          indicatorStyle,
        ]}
      />
      <Pressable style={styles.btn} onPress={() => onChange("album")}>
        <Ionicons
          name="grid"
          size={16}
          color={mode === "album" ? "#fff" : c.textMuted}
        />
      </Pressable>
      <Pressable style={styles.btn} onPress={() => onChange("list")}>
        <Ionicons
          name="list"
          size={18}
          color={mode === "list" ? "#fff" : c.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: W,
    height: H,
    borderRadius: H / 2,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
  },
  indicator: {
    position: "absolute",
    width: W / 2,
    height: "100%",
    borderRadius: H / 2,
  },
  btn: {
    width: W / 2,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
