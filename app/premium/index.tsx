import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { usePremium, PremiumPlan } from "@/context/PremiumContext";
import { useTheme } from "@/context/ThemeContext";

// ── Renk Paleti ──────────────────────────────────────────────
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F5D97A";
const GOLD_DARK = "#9A7A1A";

// ── Paketler ─────────────────────────────────────────────────
const PACKAGES: {
  id: PremiumPlan;
  label: string;
  duration: string;
  price: string;
  perDay: string;
  badge: string | null;
  popular: boolean;
}[] = [
  {
    id: "day",
    label: "1 Günlük",
    duration: "24 Saat",
    price: "₺19,99",
    perDay: "₺19,99/gün",
    badge: null,
    popular: false,
  },
  {
    id: "week",
    label: "7 Günlük",
    duration: "1 Hafta",
    price: "₺69,99",
    perDay: "₺10,00/gün",
    badge: "En Popüler",
    popular: true,
  },
  {
    id: "month",
    label: "1 Aylık",
    duration: "30 Gün",
    price: "₺149,99",
    perDay: "₺5,00/gün",
    badge: "En İyi Değer",
    popular: false,
  },
];

// ── Özellikler ────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "heart" as const,
    label: "Sınırsız Beğeni",
    desc: "Günlük limit yok, istediğin kadar beğen",
  },
  {
    icon: "hand-right" as const,
    label: "Sınırsız Hi Mesajı",
    desc: "Tüm profillere sınırsız selam gönder",
  },
  {
    icon: "eye" as const,
    label: "Profilini Görüntüleyenler",
    desc: "Kim baktığını gör, gizem yok",
  },
  {
    icon: "heart-circle" as const,
    label: "Seni Beğenenler",
    desc: "Sana kalp atan kişileri keşfet",
  },
  {
    icon: "diamond" as const,
    label: "VIP Rozeti",
    desc: "Profilinde altın VIP etiketi taş",
  },
  {
    icon: "rocket" as const,
    label: "Öncelikli Görünüm",
    desc: "Keşfet'te diğerlerinin önüne çık",
  },
];

export default function PremiumScreen() {
  const { isPremium, premiumExpiry, activatePremium } = usePremium();
  const { theme } = useTheme();
  const c = theme.colors;
  const isDark = theme.mode === "dark";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PremiumPlan>("week");
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    const pkg = PACKAGES.find((p) => p.id === selected)!;
    Alert.alert(
      "Premium'a Geç 👑",
      `${pkg.label} paket — ${pkg.price}\n\nSatın almak istiyor musun?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Satın Al",
          onPress: async () => {
            setLoading(true);
            try {
              await activatePremium(selected);
              Alert.alert(
                "🎉 Tebrikler!",
                "VIP Premium üyeliğin aktifleştirildi. Ayrıcalıkların seni bekliyor!",
                [{ text: "Harika!", onPress: () => router.back() }]
              );
            } catch {
              Alert.alert("Hata", "Satın alma başarısız. Lütfen tekrar dene.");
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
      {/* Arka plan gradyanı — temaya uyumlu */}
      <LinearGradient
        colors={isDark
          ? ["#1A0A00", "#100C0A", "#0A0A0A"]
          : [`${GOLD}14`, `${GOLD}06`, c.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Kapatma butonu */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={14}
        style={[styles.closeBtn, { top: insets.top + 10 }]}
      >
        <View style={styles.closeBtnInner}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
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
            colors={[`${GOLD}22`, `${GOLD}06`]}
            style={styles.crownCircle}
          >
            <Text style={styles.crownEmoji}>👑</Text>
          </LinearGradient>

          <Text style={styles.heroTitle}>VIP Premium</Text>
          <Text style={styles.heroSub}>
            Tüm kısıtlamaları kaldır, öne çık.{"\n"}
            Gerçek bağlantılar için en iyi araçlar.
          </Text>

          {isPremium && premiumExpiry && (
            <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.activePill}>
              <Ionicons name="checkmark-circle" size={14} color={GOLD} />
              <Text style={styles.activePillText}>
                Aktif · {premiumExpiry.toLocaleDateString("tr-TR")}'e kadar
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Özellikler kartı ── */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={[styles.featuresCard, { backgroundColor: c.card, borderColor: `${GOLD}20` }]}
        >
          <View style={styles.featuresCardHeader}>
            <View style={[styles.featureHeaderIcon, { backgroundColor: `${GOLD}18` }]}>
              <Ionicons name="star" size={16} color={GOLD} />
            </View>
            <Text style={[styles.featuresCardTitle, { color: c.text }]}>Premium Ayrıcalıkları</Text>
          </View>

          {FEATURES.map((f, i) => (
            <View
              key={f.label}
              style={[
                styles.featureRow,
                i < FEATURES.length - 1 && styles.featureDivider,
              ]}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: `${GOLD}14` }]}>
                <Ionicons name={f.icon} size={17} color={GOLD} />
              </View>
              <View style={styles.featureTexts}>
                <Text style={[styles.featureLabel, { color: c.text }]}>{f.label}</Text>
                <Text style={[styles.featureDesc, { color: c.textMuted }]}>{f.desc}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={GOLD} />
            </View>
          ))}
        </Animated.View>

        {/* ── Paket seçimi ── */}
        <Animated.View
          entering={FadeInDown.delay(280).duration(400)}
          style={styles.packagesSection}
        >
          <Text style={styles.packagesSectionTitle}>Plan Seç</Text>

          <View style={styles.packagesRow}>
            {PACKAGES.map((pkg) => {
              const isSelected = selected === pkg.id;
              return (
                <Pressable
                  key={pkg.id}
                  onPress={() => setSelected(pkg.id)}
                  style={[
                    styles.packageCard,
                    { backgroundColor: c.card, borderColor: isSelected ? GOLD : c.border },
                    isSelected && styles.packageCardActive,
                    pkg.popular && !isSelected && { borderColor: `${GOLD}50` },
                  ]}
                >
                  {pkg.badge && (
                    <View
                      style={[
                        styles.pkgBadge,
                        pkg.popular
                          ? { backgroundColor: GOLD }
                          : { backgroundColor: `${GOLD}30`, borderWidth: 1, borderColor: `${GOLD}60` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pkgBadgeText,
                          { color: pkg.popular ? "#000" : GOLD },
                        ]}
                      >
                        {pkg.badge}
                      </Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.pkgLabel,
                      { color: isSelected ? GOLD : c.textMuted },
                    ]}
                  >
                    {pkg.label}
                  </Text>
                  <Text
                    style={[
                      styles.pkgPrice,
                      { color: isSelected ? c.text : c.text },
                    ]}
                  >
                    {pkg.price}
                  </Text>
                  <Text style={styles.pkgPerDay}>{pkg.perDay}</Text>

                  {isSelected && (
                    <View style={[styles.pkgCheck, { backgroundColor: GOLD }]}>
                      <Ionicons name="checkmark" size={10} color="#000" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Güvenli ödeme notu ── */}
        <Animated.View
          entering={FadeInDown.delay(360).duration(400)}
          style={styles.safePayRow}
        >
          <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.35)" />
          <Text style={styles.safePayText}>Güvenli ödeme · SSL şifreli</Text>
        </Animated.View>
      </ScrollView>

      {/* ── Alt CTA butonu ── */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <LinearGradient
          colors={["rgba(10,8,7,0)", "rgba(10,8,7,0.98)"]}
          style={styles.bottomFade}
          pointerEvents="none"
        />

        <Pressable
          onPress={handlePurchase}
          disabled={loading || isPremium}
          style={styles.ctaWrap}
        >
          <LinearGradient
            colors={[GOLD_DARK, GOLD, GOLD_LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaBtn, (loading || isPremium) && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : isPremium ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#000" />
                <Text style={styles.ctaBtnText}>Premium Aktif ✓</Text>
              </>
            ) : (
              <>
                <Ionicons name="diamond" size={20} color="#000" />
                <Text style={styles.ctaBtnText}>Premium'a Geç</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Text style={styles.ctaNote}>
          Abonelik otomatik yenilenmez · İptal kolaylıkla yapılabilir
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
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Hero ──
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  crownCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  crownEmoji: { fontSize: 48 },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: GOLD,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 21,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    backgroundColor: `${GOLD}18`,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activePillText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Özellikler ──
  featuresCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "rgba(20,15,10,0.8)",
    borderWidth: 1,
    borderColor: `${GOLD}20`,
    padding: 16,
    marginBottom: 20,
  },
  featuresCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  featureHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featuresCardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  featureDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTexts: { flex: 1 },
  featureLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  featureDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 1,
  },

  // ── Paketler ──
  packagesSection: { marginHorizontal: 16, marginBottom: 12 },
  packagesSectionTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  packagesRow: {
    flexDirection: "row",
    gap: 10,
  },
  packageCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(20,15,10,0.8)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 14,
    position: "relative",
    overflow: "hidden",
  },
  packageCardActive: {
    borderColor: GOLD,
    backgroundColor: `${GOLD}12`,
  },
  packageCardPopular: {
    borderColor: `${GOLD}50`,
  },
  pkgBadge: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    paddingVertical: 4,
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pkgBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  pkgLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 4,
  },
  pkgPrice: {
    fontSize: 17,
    fontWeight: "800",
  },
  pkgPerDay: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    marginTop: 3,
  },
  pkgCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Güvenli ödeme ──
  safePayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 16,
  },
  safePayText: {
    color: "rgba(255,255,255,0.3)",
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
    height: 60,
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
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  ctaNote: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 11,
    textAlign: "center",
  },
});
