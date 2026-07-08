import { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useCoins, TOKENS_PER_MESSAGE } from "@/context/CoinsContext";
import { useUser } from "@/hooks/useUser";
import type { UserProfile } from "@/context/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { UserPostsSection } from "@/components/profile/UserPostsSection";
import { useInteractions } from "@/context/InteractionsContext";
import { SentToast } from "@/components/discover/SentToast";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { ReportSheet } from "@/components/common/ReportSheet";
import { api } from "@/config/api";

const SCREEN_W = Dimensions.get("window").width;
const HERO_H = SCREEN_W * 1.15;

export default function UserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { hasSent, sendRandomHi } = useInteractions();
  const { balance: tokenBalance } = useCoins();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const { user, loading } = useUser(id);
  const { posts: userPosts } = usePosts(id ?? undefined);
  const photos = useMemo(() => {
    if (!user) return [];
    if (user.photos?.length) return user.photos;
    if (user.photoURL) return [user.photoURL];
    return [];
  }, [user]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [toast, setToast] = useState<{ user: UserProfile; text: string; emoji: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // Record profile view
  useEffect(() => {
    if (id) {
      api.post(`/api/users/${id}/view`).catch(() => {});
    }
  }, [id]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_H - 100, HERO_H - 40], [0, 1], "clamp"),
  }));

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.notFound}>
          <ActivityIndicator color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: c.text }]}>Kullanıcı bulunamadı</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: c.primary }]}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function openChat(draft?: string) {
    if (tokenBalance < TOKENS_PER_MESSAGE) {
      showAlert(
        "Jeton Yetersiz 🪙",
        `Mesaj göndermek için ${TOKENS_PER_MESSAGE} jeton gerekiyor. Şu an ${tokenBalance} jetonun var.`,
        [
          { text: "İptal", style: "cancel" },
          { text: "Jeton Al →", onPress: () => router.push("/premium/coins") },
        ]
      );
      return;
    }
    const path = draft
      ? `/chat/${user!.uid}?draft=${encodeURIComponent(draft)}`
      : `/chat/${user!.uid}`;
    router.push(path as any);
  }

  return (
    <View style={[styles.safe, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SentToast
        show={!!toast}
        userName={toast?.user.name}
        userPhoto={toast?.user.photoURL || toast?.user.photos?.[0]}
        message={toast?.text}
        emoji={toast?.emoji}
        topInset={insets.top}
      />

      <Animated.View
        style={[
          styles.stickyHeader,
          headerStyle,
          {
            backgroundColor: c.surface,
            borderBottomColor: c.border,
            paddingTop: insets.top,
          },
        ]}
      >
        <Text style={[styles.stickyTitle, { color: c.text }]} numberOfLines={1}>
          {user.name}{user.age != null ? `, ${user.age}` : ""}
        </Text>
      </Animated.View>

      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={[styles.backBtn, { top: insets.top + 8 }]}
      >
        <View style={styles.iconBg}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </View>
      </Pressable>

      <Pressable hitSlop={10} style={[styles.moreBtn, { top: insets.top + 8 }]} onPress={() => setReportOpen(true)}>
        <View style={styles.iconBg}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
        </View>
      </Pressable>

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        type="user"
        targetName={user?.name}
        targetId={user?.uid}
        targetPhoto={photos[0]}
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setPhotoIndex(idx);
            }}
          >
            {photos.map((p, i) => (
              <Image key={i} source={{ uri: p }} style={styles.heroPhoto} />
            ))}
          </ScrollView>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]}
            locations={[0, 0.55, 1]}
            style={styles.heroGradient}
            pointerEvents="none"
          />

          <View style={styles.dotsRow} pointerEvents="none">
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pageDot,
                  {
                    backgroundColor: i === photoIndex ? "#fff" : "rgba(255,255,255,0.4)",
                    width: i === photoIndex ? 22 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.heroInfo} pointerEvents="none">
            <View style={styles.nameRow}>
              <Text style={styles.heroName}>
                {user.name}{user.age != null ? `, ${user.age}` : ""}
              </Text>
              {user.verified && <VerifiedBadge size={18} />}
              {user.vip && (
                <View style={[styles.vipPill, { backgroundColor: c.secondary }]}>
                  <Ionicons name="diamond" size={10} color="#fff" />
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              {user.city ? (
                <>
                  <Ionicons name="location" size={14} color="#fff" />
                  <Text style={styles.metaText}>{user.city}</Text>
                  <View style={styles.metaDot} />
                </>
              ) : null}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: user.online ? c.online : "rgba(255,255,255,0.45)" },
                ]}
              />
              <Text style={styles.metaText}>
                {user.online ? "Çevrimiçi" : "Çevrimdışı"}
              </Text>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.body}>
          {user.bio ? (
            <Section title="Hakkında" c={c}>
              <Text style={[styles.bioText, { color: c.text }]}>{user.bio}</Text>
            </Section>
          ) : null}

          <Section title="Bilgiler" c={c}>
            {user.job && <InfoRow icon="briefcase-outline" label="Meslek" value={user.job} c={c} />}
            {user.height && (
              <InfoRow icon="resize-outline" label="Boy" value={`${user.height} cm`} c={c} />
            )}
            {user.city && (
              <InfoRow icon="location-outline" label="Şehir" value={user.city} c={c} />
            )}
            <InfoRow
              icon="time-outline"
              label="Aktiflik"
              value={user.online ? "Şu an çevrimiçi" : "Bilinmiyor"}
              c={c}
            />
          </Section>

          {(user.interests?.length ?? 0) > 0 && (
            <Section title="İlgi Alanları" c={c}>
              <View style={styles.chips}>
                {user.interests!.map((it, i) => (
                  <Animated.View key={it} entering={FadeIn.delay(80 * i).duration(280)}>
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: c.surface, borderColor: c.border },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: c.text }]}>{it}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Section>
          )}

          <UserPostsSection posts={userPosts} colors={c} />

          {photos.length > 1 && (
            <Section title="Fotoğraflar" c={c}>
              <View style={styles.galleryGrid}>
                {photos.map((p, i) => (
                  <Image key={i} source={{ uri: p }} style={styles.galleryItem} />
                ))}
              </View>
            </Section>
          )}
        </Animated.View>
      </Animated.ScrollView>

      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: c.surface,
            borderTopColor: c.border,
            paddingBottom: Platform.OS === "ios" ? insets.bottom + 8 : 14,
          },
        ]}
      >
        {/* Ana buton */}
        <Pressable
          onPress={() => openChat()}
          style={({ pressed }) => [
            styles.hiBtn,
            { backgroundColor: c.primary, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          <Text style={styles.hiBtnText}>Mesaj Gönder</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({
  title,
  c,
  children,
}: {
  title: string;
  c: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: c.card, borderColor: c.border }]}>
        {children}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  c,
}: {
  icon: any;
  label: string;
  value: string;
  c: any;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: c.surface }]}>
        <Ionicons name={icon} size={16} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: c.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: c.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontWeight: "600" },
  backLink: { padding: 8 },
  backLinkText: { fontSize: 14, fontWeight: "700" },

  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 56,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  stickyTitle: { fontSize: 16, fontWeight: "700" },

  backBtn: { position: "absolute", left: 12, zIndex: 20 },
  moreBtn: { position: "absolute", right: 12, zIndex: 20 },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  hero: { width: SCREEN_W, height: HERO_H, backgroundColor: "#000" },
  heroPhoto: { width: SCREEN_W, height: HERO_H },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" },

  dotsRow: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 60,
  },
  pageDot: { height: 6, borderRadius: 3 },

  heroInfo: { position: "absolute", left: 20, right: 20, bottom: 18 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroName: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  vipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  vipText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  metaText: { color: "rgba(255,255,255,0.92)", fontSize: 13, fontWeight: "500" },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 2,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  body: { padding: 16, gap: 4 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionBody: { borderRadius: 16, borderWidth: 1, padding: 14 },
  bioText: { fontSize: 15, lineHeight: 22 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  galleryItem: {
    width: (SCREEN_W - 32 - 28 - 12) / 3,
    height: (SCREEN_W - 32 - 28 - 12) / 3,
    borderRadius: 10,
  },

  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  // Ana buton
  hiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  hiBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
