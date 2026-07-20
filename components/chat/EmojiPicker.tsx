import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { EMOJI_CATEGORIES } from "@/constants/gifts";
import { useLanguage } from "@/context/LanguageContext";

const { width: W } = Dimensions.get("window");
const COLS = 7;
const CELL = Math.floor((W - 24) / COLS); // 12px padding each side

type Props = {
  onPick: (emoji: string) => void;
  colors: any;
};

export function EmojiPicker({ onPick, colors: c }: Props) {
  const { t } = useLanguage();
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
                {t(cat.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Emoji grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
      >
        <View style={styles.emojiGrid}>
          {active.emojis.map((item, i) => (
            <Pressable
              key={`${tab}-${i}`}
              onPress={() => onPick(item)}
              style={({ pressed }) => [
                styles.emojiCell,
                { backgroundColor: pressed ? c.surface : "transparent" },
              ]}
            >
              <Text style={styles.emojiText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  tabsRow: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  tabText: { fontSize: 12, fontWeight: "600" },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 4,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emojiCell: {
    width: CELL,
    height: CELL,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  emojiText: { fontSize: 26 },
});
