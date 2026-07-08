import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useCoins, TOKENS_PER_MESSAGE } from "@/context/CoinsContext";
import { useTheme } from "@/context/ThemeContext";
import { useAppConfig } from "@/hooks/useAppConfig";

// ── Renk Paleti ──────────────────────────────────────────────
const COIN = "#F59E0B";
const COIN_LIGHT = "#FCD34D";
const COIN_DARK = "#B45309";

// ── Jeton paketleri ───────────────────────────────────────────
const COIN_PACKAGES = [
  {
    id: "pack_100",
    tokens: 100,
    price: "₺9,99",
    messages: 10,
    badge: null,
    popular: false,
    bonus: null,
    coinCount: 1 as 1 | 3 | "chest",
  },
  {
    id: "pack_500",
    tokens: 500,
    price: "₺39,99",
    messages: 50,
    badge: "En Popüler",
    popular: true,
    bonus: "%20 Bonus",
    coinCount: 3 as 1 | 3 | "chest",
  },
  {
    id: "pack_1000",
    tokens: 1000,
    price: "₺69,99",
    messages: 100,
    badge: "En İyi Değer",
    popular: false,
    bonus: "%30 Bonus",
    coinCount: "chest" as 1 | 3 | "chest",
  },
];

// ── Kullanım açıklamaları ─────────────────────────────────────
const HOW_TO = [
  {
    icon: "chatbubble-ellipses" as const,
    label: "Mesaj Gönder",
    desc: `Her mesaj ${TOKENS_PER_MESSAGE} jeton harcar`,
    color: "#6366F1",
  },
  {
    icon: "gift" as const,
    label: "Hediye Gönder",
    desc: "Özel hediyeler jeton ile satın alınır",
    color: "#EC4899",
  },
  {
    icon: "flash" as const,
    label: "Öne Çık",
    desc: "Profilini boost'la, daha fazla görün",
    color: COIN,
  },
];

// ── Özel jeton ikon bileşeni ──────────────────────────────────
function CoinIcon({ type }: { type: 1 | 3 | "chest" }) {
  if (type === 1) {
    return (
      <View style={iconStyles.singleWrap}>
        <Text style={iconStyles.coinEmoji}>🪙</Text>
      </View>
    );
  }
  if (type === 3) {
    return (
      <View style={iconStyles.tripleWrap}>
        {/* Alt sol */}
        <Text style={[iconStyles.triCoin, iconStyles.triLeft]}>🪙</Text>
        {/* Alt sağ */}
        <Text style={[iconStyles.triCoin, iconStyles.triRight]}>🪙</Text>
        {/* Üst orta */}
        <Text style={[iconStyles.triCoin, iconStyles.triTop]}>🪙</Text>
      </View>
    );
  }
  // chest
  return (
    <View style={iconStyles.chestWrap}>
      <Text style={iconStyles.chestEmoji}>💰</Text>
      <View style={iconStyles.chestSparkle}>
        <Text style={{ fontSize: 10 }}>✨</Text>
      </View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  singleWrap: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  coinEmoji: { fontSize: 36 },
  tripleWrap: { width: 52, height: 48, position: "relative" },
  triCoin: { fontSize: 24, position: "absolute" },
  triLeft: { bottom: 0, left: 0 },
  triRight: { bottom: 0, right: 0 },
  triTop: { top: 0, left: "25%" as any },
  chestWrap: { width: 52, height: 48, alignItems: "center", justifyContent: "center", position: "relative" },
  chestEmoji: { fontSize: 36 },
  chestSparkle: { position: "absolute", top: -2, right: -4 },
});

export default function CoinsScreen() {
  const { balance, add } = useCoins();
  const { theme } = useTheme();
  const c = theme.colors;
  const isDark = theme.mode === "dark";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState("pack_500");
  const [loading, setLoading] = useState(false);
  const { coinPackages: cfgCoins } = useAppConfig();

  // Paketler admin panelden yönetilir; boşsa yerel varsayılana düş
  const packages = useMemo(() => {
    if (!cfgCoins || cfgCoins.length === 0) return COIN_PACKAGES;
    return cfgCoins.map((p, i) => ({
      id: p.id,
      tokens: p.tokens,
      price: p.price,
      messages: p.messages ?? Math.round((p.tokens || 0) / (TOKENS_PER_MESSAGE || 10)),
      badge: p.popular ? "En Popüler" : p.bonus ? "En İyi Değer" : null,
      popular: !!p.popular,
      bonus: p.bonus || null,
      coinCount: (i === 0 ? 1 : i === 1 ? 3 : "chest") as 1 | 3 | "chest",
    }));
  }, [cfgCoins]);

  const selectedPkg = packages.find((p) => p.id === selected) ?? packages[0];

  async function handlePurchase() {
    showAlert(
      "Jeton Satın Al 🪙",
      `${selectedPkg.tokens} jeton ${selectedPkg.price} karşılığında satın almak istiyor musun?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Satın Al",
          onPress: async () => {
            setLoading(true);
            try {
              await add(selectedPkg.tokens);
              showAlert(
                "🎉 Jeton Eklendi!",
                `${selectedPkg.tokens} jeton hesabına eklendi. Şimdi sohbet başlatabilirsin!`,
                [{ text: "Harika!", onPress: () => router.back() }]
              );
            } catch {
              showAlert("Hata", "Satın alma başarısız. Lütfen tekrar dene.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {/* Arka plan — temaya uyumlu */}
      <LinearGradient
        colors={isDark
          ? ["#080A07", "#0C0E0A", "#0A0A0A"]
          : [`${COIN}12`, `${COIN}04`, c.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Kapatma */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={14}
        style={[styles.closeBtn, { top: insets.top + 10 }]}
      >
        <View style={[styles.closeBtnInner, { backgroundColor: `${c.text}14` }]}>
          <Ionicons name="close" size={20} color={c.text} />
        </View>
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* ── Hero ── */}
        <Animated.View entering={ZoomIn.delay(80).duration(500)} style={styles.hero}>
          <LinearGradient
            colors={[`${COIN}25`, `${COIN}06`]}
            style={styles.coinCircle}
          >
            <Text style={styles.coinEmoji}>🪙</Text>
          </LinearGradient>

          <Text style={[styles.heroTitle, { color: COIN }]}>Jeton Satın Al</Text>
          <Text style={[styles.heroSub, { color: c.textMuted }]}>
            Mesaj gönder, hediye ver, öne çık.{"\n"}
            Her şey jetonla daha kolay.
          </Text>

          {/* Mevcut bakiye */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={[styles.balancePill, { backgroundColor: `${COIN}15`, borderColor: `${COIN}35` }]}>
            <Ionicons name="wallet" size={14} color={COIN} />
            <Text style={[styles.balanceText, { color: c.textMuted }]}>
              Mevcut Bakiye:{" "}
              <Text style={[styles.balanceAmount, { color: COIN }]}>{balance} Jeton</Text>
            </Text>
          </Animated.View>
        </Animated.View>

        {/* ── Kullanım bilgisi ── */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={[styles.howToCard, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <View style={styles.howToHeader}>
            <View style={[styles.howToIconWrap, { backgroundColor: `${COIN}18` }]}>
              <Ionicons name="information-circle" size={16} color={COIN} />
            </View>
            <Text style={[styles.howToTitle, { color: c.text }]}>Jetonlar Nasıl Kullanılır?</Text>
          </View>

          <View style={styles.howToRow}>
            {HOW_TO.map((item) => (
              <View key={item.label} style={styles.howToItem}>
                <View style={[styles.howToItemIcon, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.howToItemLabel, { color: c.text }]}>{item.label}</Text>
                <Text style={[styles.howToItemDesc, { color: c.textMuted }]}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Paket seçimi ── */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={styles.packagesSection}
        >
          <Text style={[styles.packagesSectionTitle, { color: c.textMuted }]}>Paket Seç</Text>

          {packages.map((pkg) => {
            const isSelected = selected === pkg.id;
            return (
              <Pressable
                key={pkg.id}
                onPress={() => setSelected(pkg.id)}
                style={[
                  styles.packageCard,
                  {
                    backgroundColor: c.card,
                    borderColor: isSelected ? COIN : c.border,
                  },
                  isSelected && { backgroundColor: `${COIN}0D` },
                ]}
              >
                {/* Sol: ikon + bilgi */}
                <View style={styles.pkgLeft}>
                  <LinearGradient
                    colors={isSelected ? [COIN_DARK, COIN] : [`${COIN}20`, `${COIN}10`]}
                    style={styles.pkgIconWrap}
                  >
                    <CoinIcon type={pkg.coinCount} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={styles.pkgTitleRow}>
                      <Text
                        style={[
                          styles.pkgTokens,
                          { color: c.text },
                        ]}
                      >
                        {pkg.tokens} Jeton
                      </Text>
                      {pkg.badge && (
                        <View
                          style={[
                            styles.pkgBadge,
                            pkg.popular
                              ? { backgroundColor: COIN }
                              : { backgroundColor: `${COIN}25`, borderWidth: 1, borderColor: `${COIN}50` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pkgBadgeText,
                              { color: pkg.popular ? "#000" : COIN },
                            ]}
                          >
                            {pkg.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.pkgMessages, { color: c.textMuted }]}>
                      ≈ {pkg.messages} mesaj gönder
                    </Text>
                    {pkg.bonus && (
                      <Text style={[styles.pkgBonus, { color: COIN }]}>
                        🎁 {pkg.bonus}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Sağ: fiyat + checkbox */}
                <View style={styles.pkgRight}>
                  <Text style={[styles.pkgPrice, { color: isSelected ? COIN : c.text }]}>
                    {pkg.price}
                  </Text>
                  <View
                    style={[
                      styles.pkgCheckbox,
                      isSelected
                        ? { backgroundColor: COIN, borderColor: COIN }
                        : { borderColor: c.border },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={12} color="#000" />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* ── Güvenli ödeme ── */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(400)}
          style={styles.safePayRow}
        >
          <Ionicons name="lock-closed" size={12} color={c.textMuted} />
          <Text style={[styles.safePayText, { color: c.textMuted }]}>
            Güvenli ödeme · SSL şifreli
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── Alt CTA ── */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <LinearGradient
          colors={[`${c.background}00`, c.background]}
          style={styles.bottomFade}
          pointerEvents="none"
        />

        <Pressable onPress={handlePurchase} disabled={loading} style={styles.ctaWrap}>
          <LinearGradient
            colors={[COIN_DARK, COIN, COIN_LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={{ fontSize: 18 }}>🪙</Text>
                <Text style={styles.ctaBtnText}>
                  {selectedPkg.tokens} Jeton — {selectedPkg.price}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Text style={[styles.ctaNote, { color: c.textMuted }]}>
          Jetonlar hesabınıza anında yüklenir
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  closeBtnInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Hero ──
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  coinCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  coinEmoji: { fontSize: 44 },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: "600",
  },
  balanceAmount: {
    fontWeight: "800",
  },

  // ── Kullanım ──
  howToCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  howToHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  howToIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  howToTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  howToRow: {
    flexDirection: "row",
    gap: 10,
  },
  howToItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  howToItemIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  howToItemLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  howToItemDesc: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },

  // ── Paketler ──
  packagesSection: { marginHorizontal: 16, marginBottom: 14 },
  packagesSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  packageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  pkgLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pkgIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pkgTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  pkgTokens: {
    fontSize: 16,
    fontWeight: "800",
  },
  pkgBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pkgBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pkgMessages: {
    fontSize: 12,
  },
  pkgBonus: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },
  pkgRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  pkgPrice: {
    fontSize: 16,
    fontWeight: "800",
  },
  pkgCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Güvenli ──
  safePayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    opacity: 0.6,
  },
  safePayText: {
    fontSize: 11,
  },

  // ── Alt CTA ──
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottomFade: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    height: 50,
  },
  ctaWrap: { marginBottom: 10 },
  ctaBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  ctaNote: {
    fontSize: 11,
    textAlign: "center",
  },
});
