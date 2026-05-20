import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useInteractions } from "@/context/InteractionsContext";
import { usePremium } from "@/context/PremiumContext";
import { MOCK_USERS } from "@/constants/mockUsers";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 16 * 2 - 12) / 2;
const CARD_H = CARD_W * 1.4;

// Mock: profilimi görüntüleyenler (ilk 6)
const VIEWERS = MOCK_USERS.slice(0, 6);
// Mock: beni beğenenler (3-9.)
const LIKED_ME = MOCK_USERS.slice(3, 9);

// Standart kullanıcıda sadece ilk 1'i net görünsün
const FREE_VISIBLE_VIEWERS = 1;
const FREE_VISIBLE_LIKED = 1;

export default function MatchesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { likedUsers } = useInteractions();
  const { isPremium } = usePremium();
  const myLikedList = Object.values(likedUsers);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 110 : 90 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Eşleşmeler</Text>
          {!isPremium && (
            <Pressable
              onPress={() => router.push("/premium")}
              style={[styles.premiumBadge, { backgroundColor: `${c.secondary}18`, borderColor: `${c.secondary}40` }]}
            >
              <Ionicons name="diamond" size={12} color={c.secondary} />
              <Text style={[styles.premiumBadgeText, { color: c.secondary }]}>Premium'a Geç</Text>
            </Pressable>
          )}
        </View>

        {/* ── Profilimi Görüntüleyenler ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <SectionLabel
            title="Profilimi Görüntüleyenler"
            count={VIEWERS.length}
            c={c}
            isPremium={isPremium}
          />

          {!isPremium && (
            <PremiumBanner
              text="Seni kimin görüntülediğini görmek için"
              c={c}
              onPress={() => router.push("/premium")}
            />
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storyRow}
          >
            {VIEWERS.map((u, i) => {
              const blurred = !isPremium && i >= FREE_VISIBLE_VIEWERS;
              return (
                <Pressable
                  key={u.id}
                  onPress={() => blurred ? router.push("/premium") : router.push(`/user/${u.id}`)}
                  style={styles.viewerItem}
                >
                  <View style={[styles.viewerRing, { borderColor: blurred ? c.border : c.primary }]}>
                    <Image
                      source={{ uri: u.photo }}
                      style={styles.viewerAvatar}
                      blurRadius={blurred ? 18 : 0}
                    />
                    {!blurred && u.online && (
                      <View style={[styles.onlineDot, { backgroundColor: c.online, borderColor: c.background }]} />
                    )}
                    {blurred && (
                      <View style={styles.blurLockViewer}>
                        <Ionicons name="lock-closed" size={14} color="#fff" />
                      </View>
                    )}
                  </View>
                  {blurred ? (
                    <Text style={[styles.viewerName, { color: c.textMuted }]}>???</Text>
                  ) : (
                    <>
                      <Text style={[styles.viewerName, { color: c.text }]} numberOfLines={1}>
                        {u.name.split(" ")[0]}
                      </Text>
                      <Text style={[styles.viewerAge, { color: c.textMuted }]}>{u.age}</Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Seni Beğenenler ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(380)}>
          <SectionLabel
            title="Seni Beğenenler"
            count={LIKED_ME.length}
            c={c}
            icon="heart"
            isPremium={isPremium}
          />

          {!isPremium && (
            <PremiumBanner
              text="Seni beğenenleri görmek için"
              c={c}
              onPress={() => router.push("/premium")}
            />
          )}

          <View style={styles.cardsGrid}>
            {LIKED_ME.map((u, i) => {
              const blurred = !isPremium && i >= FREE_VISIBLE_LIKED;
              return (
                <Pressable
                  key={u.id}
                  onPress={() => blurred ? router.push("/premium") : router.push(`/user/${u.id}`)}
                  style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
                >
                  <Image
                    source={{ uri: u.photo }}
                    style={styles.cardPhoto}
                    blurRadius={blurred ? 22 : 0}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.82)"]}
                    style={styles.cardGradient}
                  />
                  {!blurred && u.vip && (
                    <View style={[styles.vipBadge, { backgroundColor: c.secondary }]}>
                      <Ionicons name="diamond" size={8} color="#fff" />
                      <Text style={styles.vipText}>VIP</Text>
                    </View>
                  )}

                  {blurred ? (
                    // Blurlu overlay
                    <View style={styles.blurOverlay}>
                      <View style={styles.blurLockCard}>
                        <Ionicons name="lock-closed" size={22} color="#fff" />
                        <Text style={styles.blurLockText}>Premium'a Geç</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {u.name}, {u.age}
                      </Text>
                      <View style={styles.cardMeta}>
                        <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.cardCity} numberOfLines={1}>{u.city}</Text>
                      </View>
                    </View>
                  )}

                  <View style={[styles.heartBadge, { backgroundColor: "rgba(255,77,109,0.9)" }]}>
                    <Ionicons name="heart" size={13} color="#fff" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Beğendiklerim ── */}
        <Animated.View entering={FadeInDown.delay(220).duration(380)}>
          <SectionLabel
            title="Beğendiklerim"
            count={myLikedList.length}
            c={c}
            icon="heart-outline"
          />
          {myLikedList.length === 0 ? (
            <View style={[styles.emptyLikes, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="heart-outline" size={28} color={c.textMuted} />
              <Text style={[styles.emptyLikesText, { color: c.textMuted }]}>
                Keşfet'te kalp ikonuna bas
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.likedRow}
            >
              {myLikedList.map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() => router.push(`/user/${u.id}`)}
                  style={styles.likedItem}
                >
                  <View style={[styles.likedRing, { borderColor: "#FF4D6D" }]}>
                    <Image source={{ uri: u.photo }} style={styles.likedAvatar} />
                    <View style={[styles.likedHeart, { backgroundColor: "#FF4D6D" }]}>
                      <Ionicons name="heart" size={10} color="#fff" />
                    </View>
                  </View>
                  <Text style={[styles.likedName, { color: c.text }]} numberOfLines={1}>
                    {u.name.split(" ")[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Alt bileşenler ──────────────────────────────────────────

function PremiumBanner({
  text,
  c,
  onPress,
}: {
  text: string;
  c: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.premiumBanner, { backgroundColor: `${c.secondary}12`, borderColor: `${c.secondary}30` }]}
    >
      <Ionicons name="lock-closed" size={14} color={c.secondary} />
      <Text style={[styles.premiumBannerText, { color: c.secondary }]}>
        {text} <Text style={{ fontWeight: "800" }}>Premium al →</Text>
      </Text>
    </Pressable>
  );
}

function SectionLabel({
  title,
  count,
  c,
  icon,
  isPremium,
}: {
  title: string;
  count: number;
  c: any;
  icon?: string;
  isPremium?: boolean;
}) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      <View style={[styles.countBadge, { backgroundColor: `${c.primary}20` }]}>
        <Text style={[styles.countText, { color: c.primary }]}>{count}</Text>
      </View>
      {!isPremium && (
        <View style={styles.lockPill}>
          <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.4)" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  premiumBadgeText: { fontSize: 12, fontWeight: "700" },

  // Premium banner
  premiumBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumBannerText: { fontSize: 13, fontWeight: "500", flex: 1 },

  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  countText: { fontSize: 12, fontWeight: "800" },
  lockPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Viewers
  storyRow: {
    paddingHorizontal: 16,
    gap: 16,
  },
  viewerItem: { alignItems: "center", width: 70 },
  viewerRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    padding: 2,
    position: "relative",
    overflow: "hidden",
  },
  viewerAvatar: { width: "100%", height: "100%", borderRadius: 30 },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  blurLockViewer: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 30,
  },
  viewerName: { fontSize: 12, fontWeight: "600", marginTop: 6, textAlign: "center" },
  viewerAge: { fontSize: 11, marginTop: 1, textAlign: "center" },

  // Cards grid
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  cardPhoto: { width: "100%", height: "100%" },
  cardGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" },
  vipBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  vipText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  // Blur overlay
  blurOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  blurLockCard: {
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  blurLockText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  cardInfo: { position: "absolute", left: 10, right: 10, bottom: 10 },
  cardName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 3 },
  cardCity: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  heartBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Beğendiklerim
  likedRow: {
    paddingHorizontal: 16,
    gap: 16,
  },
  likedItem: { alignItems: "center", width: 68 },
  likedRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
    position: "relative",
  },
  likedAvatar: { width: "100%", height: "100%", borderRadius: 28 },
  likedHeart: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  likedName: { fontSize: 11, fontWeight: "600", marginTop: 5, textAlign: "center" },

  emptyLikes: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyLikesText: { fontSize: 14, textAlign: "center" },
});
