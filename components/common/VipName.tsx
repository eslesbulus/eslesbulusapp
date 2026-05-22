import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

type Props = {
  name: string;
  vip?: boolean;
  style?: any;
  fontSize?: number;
  numberOfLines?: number;
};

/**
 * Renders a username with VIP gold gradient styling if user is VIP.
 * Falls back to normal text with the given style if not VIP.
 */
export function VipName({ name, vip, style, fontSize = 15, numberOfLines = 1 }: Props) {
  if (!vip) {
    return (
      <Text style={[{ fontSize, fontWeight: "700" }, style]} numberOfLines={numberOfLines}>
        {name}
      </Text>
    );
  }

  return (
    <View style={s.row}>
      <MaskedView
        maskElement={
          <Text style={[{ fontSize, fontWeight: "800" }, s.mask]} numberOfLines={numberOfLines}>
            {name}
          </Text>
        }
      >
        <LinearGradient
          colors={["#FFD700", "#FFA500", "#FFD700"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[{ fontSize, fontWeight: "800", opacity: 0 }]} numberOfLines={numberOfLines}>
            {name}
          </Text>
        </LinearGradient>
      </MaskedView>
      <Text style={s.crown}> 👑</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  mask: { color: "#000" },
  crown: { fontSize: 10, marginLeft: 1 },
});
