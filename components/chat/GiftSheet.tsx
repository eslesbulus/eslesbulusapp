import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useCoins } from "@/context/CoinsContext";
import { GIFTS, Gift } from "@/constants/gifts";

function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace("#", "");
  const safe = m.length === 6 ? m : "888888";
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const { width: W } = Dimensions.get("window");

type Props = {
  onSend: (gift: Gift) => void;
  recipientName: string;
  recipientPhoto: string;
  colors: any;
};

const RARITY_LABEL: Record<string, string> = {
  common: "Sıradan",
  rare: "Nadir",
  epic: "Efsanevi",
  legendary: "Destansı",
};

const RARITY_GRAD: Record<string, [string, string]> = {
  common: ["#64748B", "#475569"],
  rare: ["#0EA5E9", "#0369A1"],
  epic: ["#A855F7", "#6D28D9"],
  legendary: ["#F59E0B", "#DC2626"],
};

export function GiftSheet({ onSend, recipientName, recipientPhoto, colors: c }: Props) {
  const { balance, spend } = useCoins();
  const [selected, setSelected] = useState<Gift | null>(null);

  function handleSend() {
    if (!selected) return;
    if (!spend(selected.price)) {
      Alert.alert("Yetersiz Jeton 🪙", `Bu hediye için ${selected.price} jeton gerekli. Bakiyen: ${balance}`);
      return;
    }
    onSend(selected);
    setSelected(null);
  }

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.recipientRow}>
          <Image source={{ uri: recipientPhoto }} style={styles.recipientAvatar} />
          <Text style={[styles.headerSub, { color: c.textMuted }]} numberOfLines={1}>
            {recipientName} için
          </Text>
        </View>
        <View style={[styles.balanceChip, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={{ fontSize: 14 }}>🪙</Text>
          <Text style={[styles.balanceText, { color: c.text }]}>{balance}</Text>
        </View>
      </View>

      {/* Grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {GIFTS.map((g, i) => {
          const isSel = selected?.id === g.id;
          const canAfford = balance >= g.price;
          return (
            <Animated.View
              key={g.id}
              entering={FadeIn.delay(i * 18).duration(180)}
              style={styles.cardSlot}
            >
              <Pressable
                onPress={() => setSelected(g)}
                style={[
                  styles.giftCard,
                  {
                    backgroundColor: c.surface,
                    borderColor: isSel ? c.primary : c.border,
                    borderWidth: isSel ? 2 : 1,
                    opacity: canAfford ? 1 : 0.55,
                  },
                ]}
              >
                <LinearGradient
                  colors={RARITY_GRAD[g.rarity]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.rarityRibbon}
                >
                  <Text style={styles.rarityText}>{RARITY_LABEL[g.rarity]}</Text>
                </LinearGradient>
                <Text style={styles.giftEmoji}>{g.emoji}</Text>
                <Text style={[styles.giftName, { color: c.text }]} numberOfLines={1}>
                  {g.name}
                </Text>
                <View style={[styles.priceRow, { backgroundColor: hexToRgba(g.color, 0.13) }]}>
                  <Text style={{ fontSize: 11 }}>🪙</Text>
                  <Text style={[styles.priceText, { color: g.color }]}>{g.price}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Send bar */}
      {selected && (
        <Animated.View entering={FadeInDown.duration(180)} style={[styles.sendBar, { borderTopColor: c.border, backgroundColor: c.card }]}>
          <View style={styles.sendInfo}>
            <Text style={styles.sendEmoji}>{selected.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sendGiftName, { color: c.text }]}>{selected.name}</Text>
              <View style={styles.sendPriceRow}>
                <Text style={{ fontSize: 13 }}>🪙</Text>
                <Text style={[styles.sendPriceText, { color: c.textMuted }]}>{selected.price} jeton</Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: c.primary }]}
          >
            <Ionicons name="paper-plane" size={14} color="#fff" />
            <Text style={styles.sendBtnText}>Gönder</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recipientRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  recipientAvatar: { width: 28, height: 28, borderRadius: 14 },
  headerSub: { fontSize: 13, fontWeight: "600" },
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  balanceText: { fontSize: 12.5, fontWeight: "700" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingBottom: 14,
    justifyContent: "space-between",
  },
  cardSlot: {
    width: "32%",
    marginBottom: 10,
  },
  giftCard: {
    width: "100%",
    aspectRatio: 0.85,
    borderRadius: 14,
    padding: 6,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 8,
    overflow: "hidden",
  },
  rarityRibbon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    alignItems: "center",
  },
  rarityText: { fontSize: 8.5, fontWeight: "800", color: "#fff", letterSpacing: 0.4 },
  giftEmoji: { fontSize: 36, marginTop: 6 },
  giftName: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9,
    marginTop: 3,
  },
  priceText: { fontSize: 11, fontWeight: "700" },

  sendBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sendInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  sendEmoji: { fontSize: 28 },
  sendGiftName: { fontSize: 13.5, fontWeight: "700" },
  sendPriceRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 1 },
  sendPriceText: { fontSize: 11.5 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
