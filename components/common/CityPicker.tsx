import { useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  FlatList,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { TURKISH_CITIES, POPULAR_CITY_SHORTLIST } from "@/constants/cities";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  visible: boolean;
  selected?: string;
  onClose: () => void;
  onSelect: (city: string) => void;
  colors: any;
};

export function CityPicker({ visible, selected, onClose, onSelect, colors: c }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return TURKISH_CITIES;
    return TURKISH_CITIES.filter((city) =>
      city.toLocaleLowerCase("tr").includes(q)
    );
  }, [query]);

  function pick(city: string) {
    onSelect(city);
    setQuery("");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar barStyle="light-content" />
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 8, borderBottomColor: c.border },
          ]}
        >
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={c.text} />
          </Pressable>
          <Text style={[styles.title, { color: c.text }]}>{t("city_picker_title")}</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("city_picker_search")}
            placeholderTextColor={c.textMuted}
            style={[styles.searchInput, { color: c.text }]}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Popular shortlist when no query */}
        {!query && (
          <View style={styles.popularSection}>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
              {t("city_picker_popular")}
            </Text>
            <View style={styles.popularRow}>
              {POPULAR_CITY_SHORTLIST.map((city) => (
                <Pressable
                  key={city}
                  onPress={() => pick(city)}
                  style={[
                    styles.popularChip,
                    {
                      backgroundColor:
                        selected === city ? c.primary : c.surface,
                      borderColor:
                        selected === city ? c.primary : c.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.popularChipText,
                      { color: selected === city ? "#fff" : c.text },
                    ]}
                  >
                    {city}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text
              style={[
                styles.sectionLabel,
                { color: c.textMuted, marginTop: 16 },
              ]}
            >
              {t("city_picker_all")} ({TURKISH_CITIES.length})
            </Text>
          </View>
        )}

        {/* List */}
        <FlatList
          data={list}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSel = item === selected;
            return (
              <Animated.View entering={FadeIn.duration(150)}>
                <Pressable
                  onPress={() => pick(item)}
                  style={[
                    styles.row,
                    { borderBottomColor: c.border },
                    isSel && { backgroundColor: `${c.primary}14` },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={isSel ? c.primary : c.textMuted}
                  />
                  <Text
                    style={[
                      styles.rowText,
                      { color: c.text, fontWeight: isSel ? "700" : "500" },
                    ]}
                  >
                    {item}
                  </Text>
                  {isSel && (
                    <Ionicons name="checkmark" size={18} color={c.primary} />
                  )}
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="search" size={32} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                {t("city_picker_no_results")}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { padding: 2 },
  title: { fontSize: 17, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },

  popularSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  popularRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  popularChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  popularChipText: { fontSize: 13, fontWeight: "600" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, fontSize: 15 },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: { fontSize: 14 },
});
