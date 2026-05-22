import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/context/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { useInteractions } from "@/context/InteractionsContext";
import { usePremium, DAILY_HI_LIMIT } from "@/context/PremiumContext";
import {
  Filters,
  DEFAULT_FILTERS,
  activeFilterCount,
} from "@/constants/filters";
import { StoriesBar } from "@/components/discover/StoriesBar";
import { VipSection } from "@/components/discover/VipSection";
import { ViewToggle, ViewMode } from "@/components/discover/ViewToggle";
import { ProfileCardAlbum } from "@/components/discover/ProfileCardAlbum";
import { ProfileCardList } from "@/components/discover/ProfileCardList";
import { SentToast } from "@/components/discover/SentToast";
import { FilterSheet } from "@/components/discover/FilterSheet";
import { NotificationsPopup } from "@/components/discover/NotificationsPopup";

export default function DiscoverScreen() {
  const { theme, mode } = useTheme();
  const { profile } = useAuth();
  const { sendRandomHi } = useInteractions();
  const { canSendHi, useHi } = usePremium();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const defaultGender: Filters["gender"] = "all";

  const [viewMode, setViewMode] = useState<ViewMode>("album");
  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    gender: defaultGender,
  }));
  const [filterOpen, setFilterOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState<{
    seq: number;
    user: UserProfile;
    text: string;
    emoji: string;
  } | null>(null);

  const filterCount = activeFilterCount(filters);
  const unreadNotifs = 0; // notifications backend pending

  const { users } = useUsers(filters);

  const rows = useMemo(() => {
    if (viewMode !== "album") return [];
    const out: UserProfile[][] = [];
    for (let i = 0; i < users.length; i += 2) {
      out.push(users.slice(i, i + 2));
    }
    return out;
  }, [users, viewMode]);

  async function handlePressHi(user: UserProfile) {
    if (!canSendHi) {
      Alert.alert(
        "Günlük Limit Doldu",
        `Bugün ${DAILY_HI_LIMIT} hi mesajı hakkını kullandın. Premium üyelikle sınırsız gönder!`,
        [
          { text: "İptal", style: "cancel" },
          { text: "Premium Al 👑", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    const allowed = await useHi();
    if (!allowed) return;
    const sent = await sendRandomHi(user.uid);
    if (sent) setToast({ seq: Date.now(), user, text: sent.text, emoji: sent.emoji });
  }

  function openProfile(user: UserProfile) {
    router.push(`/user/${user.uid}`);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <SentToast
        show={!!toast}
        userName={toast?.user.name}
        userPhoto={toast?.user.photoURL || toast?.user.photos?.[0]}
        message={toast?.text}
        emoji={toast?.emoji}
        topInset={insets.top}
      />

      <View style={styles.header}>
        <View>
          <Text style={[styles.brand, { color: c.text }]}>Keşfet</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            {users.length} kişi {filterCount > 0 ? "filtreli" : "yakınında"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <HeaderBtn
            onPress={() => setNotifOpen(true)}
            icon="notifications-outline"
            c={c}
            badge={unreadNotifs}
          />
          <HeaderBtn
            onPress={() => setFilterOpen(true)}
            icon="options-outline"
            c={c}
            badge={filterCount}
            badgeAccent
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 110 : 90 }}
      >
        <StoriesBar
          onPressUser={(u) => router.push(`/story/${u.uid}`)}
          onPressAdd={() => router.push("/story/create")}
        />

        <VipSection onPressUser={openProfile} />

        <View style={styles.toolbar}>
          <View>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Sana yakın</Text>
            {filterCount > 0 && (
              <Pressable
                onPress={() => setFilters(DEFAULT_FILTERS)}
                style={styles.clearFiltersBtn}
              >
                <Ionicons name="close-circle" size={12} color={c.primary} />
                <Text style={[styles.clearFiltersText, { color: c.primary }]}>
                  {filterCount} filtre — Temizle
                </Text>
              </Pressable>
            )}
          </View>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </View>

        {users.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="search" size={32} color={c.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>Sonuç yok</Text>
            <Text style={[styles.emptyHint, { color: c.textMuted }]}>
              Filtreyi gevşet ya da temizle
            </Text>
            <Pressable
              onPress={() => setFilters(DEFAULT_FILTERS)}
              style={[styles.emptyBtn, { backgroundColor: c.primary }]}
            >
              <Text style={styles.emptyBtnText}>Filtreyi sıfırla</Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View
            key={`${viewMode}-${filterCount}`}
            entering={FadeIn.duration(220)}
            layout={Layout.springify()}
            style={styles.list}
          >
            {viewMode === "album" ? (
              rows.map((pair, ri) => (
                <View key={ri} style={styles.row}>
                  {pair.map((u) => (
                    <ProfileCardAlbum
                      key={u.uid}
                      user={u}
                      onPressHi={handlePressHi}
                      onPress={openProfile}
                    />
                  ))}
                  {pair.length === 1 && <View style={styles.spacer} />}
                </View>
              ))
            ) : (
              users.map((u) => (
                <ProfileCardList
                  key={u.uid}
                  user={u}
                  onPressHi={handlePressHi}
                  onPress={openProfile}
                />
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>

      <FilterSheet
        visible={filterOpen}
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />

      <NotificationsPopup
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        topInset={insets.top}
      />
    </SafeAreaView>
  );
}

function HeaderBtn({
  onPress,
  icon,
  c,
  badge = 0,
  badgeAccent = false,
}: {
  onPress: () => void;
  icon: any;
  c: any;
  badge?: number;
  badgeAccent?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.headerBtn}>
      <Ionicons name={icon} size={22} color={c.text} />
      {badge > 0 && (
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeAccent ? c.primary : c.secondary, borderColor: c.background },
          ]}
        >
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brand: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  clearFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  clearFiltersText: { fontSize: 11, fontWeight: "700" },

  list: { paddingHorizontal: 16, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  spacer: { flex: 1 },

  emptyWrap: { alignItems: "center", padding: 32, gap: 8 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyHint: { fontSize: 13, marginBottom: 12 },
  emptyBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
