import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useCoins } from "@/context/CoinsContext";
import { GIFTS, Gift } from "@/constants/gifts";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 16 * 2 - 12 * 2) / 3;

type Props = {
  visible: boolean;
  onClose: () => void;
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

export function GiftSheet({ visible, onClose, onSend, recipientName, recipientPhoto, colors: c }: Props) {
  const { balance, spend } = useCoins();
  const [selected, setSelected] = useState<Gift | null>(null);

  function handleSend() {
    if (!selected) return;
    if (!spend(selected.price)) {
      Alert.alert("Yetersiz Coin", `Bu hediye için ${selected.price} coin gerekli. Bakiyen: ${balance}`);
      return;
    }
    onSend(selected);
    setSelected(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]}
        onPress={onClose}
      />

      <View style={styles.wrap} pointerEvents="box-none">
        <Animated.View entering={FadeInUp.duration(280)} style={[styles.sheet, { backgroundColor: c.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.recipientRow}>
              <Image source={{ uri: recipientPhoto }} style={styles.recipientAvatar} />
              <View>
                <Text style={[styles.headerTitle, { color: c.text }]}>Hediye Gönder</Text>
                <Text style={[styles.headerSub, { color: c.textMuted }]} numberOfLines={1}>
                  {recipientName}
                </Text>
              </View>
            </View>
            <View style={[styles.balanceChip, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="logo-bitcoin" size={14} color="#F59E0B" />
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
                <Animated.View key={g.id} entering={FadeIn.delay(i * 25).duration(220)}>
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
                    <Text style={[styles.giftName, { color: c.text }]}>{g.name}</Text>
                    <View style={[styles.priceRow, { backgroundColor: g.color + "22" }]}>
                      <Ionicons name="logo-bitcoin" size={11} color="#F59E0B" />
                      <Text style={[styles.priceText, { color: g.color }]}>{g.price}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>

          {/* Send bar */}
          {selected && (
            <Animated.View entering={FadeInDown.duration(220)} style={[styles.sendBar, { borderTopColor: c.border, backgroundColor: c.card }]}>
              <View style={styles.sendInfo}>
                <Text style={[styles.sendEmoji]}>{selected.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sendGiftName, { color: c.text }]}>{selected.name}</Text>
                  <View style={styles.sendPriceRow}>
                    <Ionicons name="logo-bitcoin" size={13} color="#F59E0B" />
                    <Text style={[styles.sendPriceText, { color: c.textMuted }]}>{selected.price} coin</Text>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={handleSend}
                style={[styles.sendBtn, { backgroundColor: c.primary }]}
              >
                <Ionicons name="paper-plane" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>Gönder</Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recipientRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  recipientAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  balanceText: { fontSize: 13, fontWeight: "700" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  giftCard: {
    width: CARD_W,
    aspectRatio: 0.85,
    borderRadius: 14,
    padding: 8,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
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
  rarityText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  giftEmoji: { fontSize: 40, marginTop: 8 },
  giftName: { fontSize: 11.5, fontWeight: "700", marginTop: 4 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  priceText: { fontSize: 12, fontWeight: "700" },

  sendBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sendInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  sendEmoji: { fontSize: 32 },
  sendGiftName: { fontSize: 14, fontWeight: "700" },
  sendPriceRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  sendPriceText: { fontSize: 12 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 18,
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
