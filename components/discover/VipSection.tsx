import { ScrollView, View, Text, Image, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { UserProfile } from "@/context/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";

type Props = { onPressUser?: (u: UserProfile) => void };

export function VipSection({ onPressUser }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const s = styles(theme.colors);
  const { users } = useUsers();
  const vipUsers = users.filter((u) => u.vip).slice(0, 12);

  if (vipUsers.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={s.wrap}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <Ionicons name="diamond" size={16} color={theme.colors.secondary} />
          <Text style={[s.title, { color: theme.colors.text }]}>{t("vip_section_title")}</Text>
        </View>
        <Pressable>
          <Text style={[s.seeAll, { color: theme.colors.secondary }]}>{t("vip_section_all")}</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.list}
      >
        {vipUsers.map((u, i) => {
          const photo = u.photoURL || u.photos?.[0];
          return (
            <Animated.View key={u.uid} entering={FadeInDown.delay(80 * i).duration(350)}>
              <Pressable onPress={() => onPressUser?.(u)} style={s.card}>
                {photo ? <Image source={{ uri: photo }} style={s.photo} /> : null}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.85)"]}
                  style={s.gradient}
                />
                <View style={s.badge}>
                  <Ionicons name="diamond" size={10} color="#fff" />
                  <Text style={s.badgeText}>VIP</Text>
                </View>
                {u.online && <View style={[s.dot, { backgroundColor: theme.colors.online }]} />}
                <View style={s.info}>
                  <View style={s.nameRow}>
                    <Text style={s.nameText} numberOfLines={1}>
                      {u.name}{u.age != null ? `, ${u.age}` : ""}
                    </Text>
                    {u.verified && <VerifiedBadge size={12} />}
                  </View>
                  {u.city ? (
                    <View style={s.cityRow}>
                      <Ionicons name="location-outline" size={11} color="#fff" />
                      <Text style={s.cityText} numberOfLines={1}>
                        {u.city}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const CARD_W = 140;
const CARD_H = 190;

const styles = (c: any) =>
  StyleSheet.create({
    wrap: { marginTop: 4 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    title: { fontSize: 17, fontWeight: "700" },
    seeAll: { fontSize: 13, fontWeight: "600" },
    list: { paddingHorizontal: 16, gap: 10 },
    card: {
      width: CARD_W,
      height: CARD_H,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: c.card,
    },
    photo: { width: "100%", height: "100%" },
    gradient: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "55%",
    },
    badge: {
      position: "absolute",
      top: 8,
      left: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: c.secondary,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
    },
    badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    dot: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: "#fff",
    },
    info: { position: "absolute", left: 10, right: 10, bottom: 10 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    nameText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    cityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
    cityText: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  });
