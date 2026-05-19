import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { EMOJI_CATEGORIES } from "@/constants/gifts";

const { width: W } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  colors: any;
};

export function EmojiPicker({ visible, onClose, onPick, colors: c }: Props) {
  const [tab, setTab] = useState(EMOJI_CATEGORIES[0].id);
  const active = EMOJI_CATEGORIES.find((cat) => cat.id === tab) ?? EMOJI_CATEGORIES[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={onClose}
      />

      <View style={styles.wrap} pointerEvents="box-none">
        <Animated.View entering={FadeInUp.duration(240)} style={[styles.sheet, { backgroundColor: c.card }]}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          <Text style={[styles.title, { color: c.text }]}>Emoji Seç</Text>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {EMOJI_CATEGORIES.map((cat) => {
              const isActive = cat.id === tab;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setTab(cat.id)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive ? c.primary : c.surface,
                      borderColor: isActive ? c.primary : c.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? "#fff" : c.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Emoji grid */}
          <FlatList
            data={active.emojis}
            keyExtractor={(item, i) => `${item}-${i}`}
            numColumns={6}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onPick(item);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.emojiCell,
                  { backgroundColor: pressed ? c.surface : "transparent" },
                ]}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </Pressable>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    height: "55%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  title: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  tabsRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  gridContent: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 16,
  },
  emojiCell: {
    width: (W - 16) / 6,
    height: (W - 16) / 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  emojiText: { fontSize: 30 },
});
