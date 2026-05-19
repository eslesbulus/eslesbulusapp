import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = { size?: number };

// Twitter-style mavi tik. İsim yanında inline kullanılır.
export function VerifiedBadge({ size = 14 }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: "#1D9BF0" },
      ]}
    >
      <Ionicons name="checkmark" size={size * 0.7} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});
