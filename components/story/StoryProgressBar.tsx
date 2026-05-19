import { View, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

type Props = {
  count: number;
  currentIndex: number;
  progress: SharedValue<number>; // 0..1, current slide içindeki ilerleme
};

export function StoryProgressBar({ count, currentIndex, progress }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Segment key={i} index={i} currentIndex={currentIndex} progress={progress} />
      ))}
    </View>
  );
}

function Segment({
  index,
  currentIndex,
  progress,
}: {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => {
    let w = 0;
    if (index < currentIndex) w = 1;
    else if (index === currentIndex) w = progress.value;
    return { width: `${interpolate(w, [0, 1], [0, 100])}%` };
  });

  return (
    <View style={styles.bg}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  bg: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
});
