import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import {
  Filters,
  DEFAULT_FILTERS,
  AGE_BOUND,
  activeFilterCount,
} from "@/constants/filters";
import { POPULAR_CITIES, Gender } from "@/constants/mockUsers";

type Props = {
  visible: boolean;
  initial: Filters;
  onClose: () => void;
  onApply: (f: Filters) => void;
};

const SCREEN_H = Dimensions.get("window").height;
// Apple-style decelerate — yumuşak başla, hızlı yerleş
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export function FilterSheet({ visible, initial, onClose, onApply }: Props) {
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const [local, setLocal] = useState<Filters>(initial);
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setLocal(initial);
      progress.value = withTiming(1, { duration: 460, easing: EASE_OUT });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 280, easing: EASE_IN }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [SCREEN_H * 0.55, 0]),
      },
    ],
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 1, 1]),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const count = activeFilterCount(local);

  function toggleCity(city: string) {
    setLocal((s) => ({
      ...s,
      cities: s.cities.includes(city)
        ? s.cities.filter((x) => x !== city)
        : [...s.cities, city],
    }));
  }

  function setGender(g: "all" | Gender) {
    setLocal((s) => ({ ...s, gender: g }));
  }

  function reset() {
    setLocal(DEFAULT_FILTERS);
  }

  function apply() {
    onApply(local);
    onClose();
  }

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={mode === "dark" ? 50 : 30}
            tint={mode === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} />
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.sheet, { backgroundColor: c.surface }, sheetStyle]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.text }]}>Filtreler</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>{count} aktif filtre</Text>
          </View>
          {count > 0 && (
            <Pressable onPress={reset} hitSlop={8} style={styles.resetBtn}>
              <Ionicons name="refresh" size={14} color={c.primary} />
              <Text style={[styles.resetText, { color: c.primary }]}>Sıfırla</Text>
            </Pressable>
          )}
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={c.textMuted} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Section title="Yaş Aralığı" c={c}>
            <View style={styles.ageRow}>
              <Text style={[styles.ageVal, { color: c.text }]}>{local.ageMin}</Text>
              <View style={[styles.ageLine, { backgroundColor: c.border }]} />
              <Text style={[styles.ageVal, { color: c.text }]}>{local.ageMax}</Text>
            </View>
            <View style={styles.sliderBlock}>
              <Text style={[styles.sliderLabel, { color: c.textMuted }]}>Minimum</Text>
              <Slider
                style={styles.slider}
                minimumValue={AGE_BOUND.min}
                maximumValue={local.ageMax}
                step={1}
                value={local.ageMin}
                minimumTrackTintColor={c.primary}
                maximumTrackTintColor={c.border}
                thumbTintColor={c.primary}
                onValueChange={(v) => setLocal((s) => ({ ...s, ageMin: Math.round(v) }))}
              />
            </View>
            <View style={styles.sliderBlock}>
              <Text style={[styles.sliderLabel, { color: c.textMuted }]}>Maximum</Text>
              <Slider
                style={styles.slider}
                minimumValue={local.ageMin}
                maximumValue={AGE_BOUND.max}
                step={1}
                value={local.ageMax}
                minimumTrackTintColor={c.primary}
                maximumTrackTintColor={c.border}
                thumbTintColor={c.primary}
                onValueChange={(v) => setLocal((s) => ({ ...s, ageMax: Math.round(v) }))}
              />
            </View>
          </Section>

          <Section title="Cinsiyet" c={c}>
            <View style={styles.segment}>
              <SegBtn label="Tümü" active={local.gender === "all"} onPress={() => setGender("all")} c={c} />
              <SegBtn label="Kadın" icon="female" active={local.gender === "kadın"} onPress={() => setGender("kadın")} c={c} />
              <SegBtn label="Erkek" icon="male" active={local.gender === "erkek"} onPress={() => setGender("erkek")} c={c} />
            </View>
          </Section>

          <Section
            title="Popüler Şehirler"
            hint={local.cities.length > 0 ? `${local.cities.length} seçili` : "İstediğin kadar seç"}
            c={c}
          >
            <View style={styles.chips}>
              {POPULAR_CITIES.map((city) => {
                const on = local.cities.includes(city);
                return (
                  <Pressable
                    key={city}
                    onPress={() => toggleCity(city)}
                    style={[
                      styles.chip,
                      { backgroundColor: on ? c.primary : c.card, borderColor: on ? c.primary : c.border },
                    ]}
                  >
                    <Ionicons name="location-outline" size={13} color={on ? "#fff" : c.textMuted} />
                    <Text style={[styles.chipText, { color: on ? "#fff" : c.text }]}>{city}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Daha Fazla" c={c}>
            <ToggleRow
              icon="radio"
              label="Sadece çevrimiçi"
              value={local.onlineOnly}
              onChange={(v) => setLocal((s) => ({ ...s, onlineOnly: v }))}
              c={c}
            />
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <ToggleRow
              icon="shield-checkmark"
              label="Sadece onaylı profiller"
              hint="Mavi tikli kullanıcılar"
              value={local.verifiedOnly}
              onChange={(v) => setLocal((s) => ({ ...s, verifiedOnly: v }))}
              c={c}
            />
          </Section>
        </ScrollView>

        <View style={[styles.actions, { borderTopColor: c.border, backgroundColor: c.surface }]}>
          <Pressable
            onPress={apply}
            style={({ pressed }) => [
              styles.applyBtn,
              { backgroundColor: c.primary, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.applyText}>Uygula {count > 0 ? `(${count})` : ""}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

function Section({ title, hint, c, children }: { title: string; hint?: string; c: any; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
        {hint && <Text style={[styles.sectionHint, { color: c.textMuted }]}>{hint}</Text>}
      </View>
      <View style={[styles.sectionBody, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

function SegBtn({ label, icon, active, onPress, c }: { label: string; icon?: any; active: boolean; onPress: () => void; c: any }) {
  return (
    <Pressable onPress={onPress} style={[styles.segBtn, { backgroundColor: active ? c.primary : "transparent" }]}>
      {icon && <Ionicons name={icon} size={15} color={active ? "#fff" : c.textMuted} />}
      <Text style={[styles.segText, { color: active ? "#fff" : c.text, fontWeight: active ? "800" : "600" }]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  value,
  onChange,
  c,
}: {
  icon: any;
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  c: any;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: c.surface }]}>
        <Ionicons name={icon} size={16} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, { color: c.text }]}>{label}</Text>
        {hint && <Text style={[styles.toggleHint, { color: c.textMuted }]}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    overflow: "hidden",
  },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  sub: { fontSize: 12, marginTop: 2 },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  resetText: { fontSize: 13, fontWeight: "700" },
  closeBtn: { padding: 4 },
  scroll: { paddingBottom: 24 },
  section: { paddingHorizontal: 16, marginBottom: 14 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionHint: { fontSize: 11, fontWeight: "600" },
  sectionBody: { borderRadius: 16, borderWidth: 1, padding: 14 },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  ageVal: { fontSize: 22, fontWeight: "800" },
  ageLine: { flex: 1, height: 1, marginHorizontal: 12 },
  sliderBlock: { marginTop: 6 },
  sliderLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  slider: { width: "100%", height: 32 },
  segment: { flexDirection: "row", gap: 6 },
  segBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  segText: { fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  toggleIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  toggleHint: { fontSize: 11, marginTop: 1 },
  divider: { height: 1, marginVertical: 4 },
  actions: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1 },
  applyBtn: { paddingVertical: 15, borderRadius: 16, alignItems: "center" },
  applyText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
