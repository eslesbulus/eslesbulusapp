import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { EMOJI_CATEGORIES } from "@/constants/gifts";

const { width: W } = Dimensions.get("window");

type Props = {
  onPick: (emoji: string) => void;
  colors: any;
};

export function EmojiPicker({ onPick, colors: c }: Props) {
  const [tab, setTab] = useState(EMOJI_CATEGORIES[0].id);
  const active = EMOJI_CATEGORIES.find((cat) => cat.id === tab) ?? EMOJI_CATEGORIES[0];

  return (
    <View style={styles.wrap}>
      {/* Category tabs */}
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
              <Text style={[styles.tabText, { color: isActive ? "#fff" : c.text }]}>
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
        numColumns={8}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item)}
            style={({ pressed }) => [
              styles.emojiCell,
              { backgroundColor: pressed ? c.surface : "transparent" },
            ]}
          >
            <Text style={styles.emojiText}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  tabsRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tabText: { fontSize: 12.5, fontWeight: "600" },
  gridContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  emojiCell: {
    width: (W - 16) / 8,
    height: (W - 16) / 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  emojiText: { fontSize: 26 },
});
