import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Switch,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { ThemePreference } from "@/constants/theme";
import { useBlockedUsers } from "@/context/BlockedUsersContext";
import { usePremium } from "@/context/PremiumContext";
import { useCoins } from "@/context/CoinsContext";
import { VerificationSheet } from "@/components/profile/VerificationSheet";
import { MyPostsSection } from "@/components/profile/MyPostsSection";
import { usePosts } from "@/hooks/usePosts";
import { api } from "@/config/api";
import { useMyTickets } from "@/hooks/useSupportTickets";
import { showAlert } from "@/components/common/CustomAlert";

const SCREEN_W = Dimensions.get("window").width;
const PHOTO_GAP = 6;
const PHOTO_PADDING = 16;
// 3 sütun, 2 gap, her iki yanda padding
const PHOTO_ITEM_W = Math.floor((SCREEN_W - PHOTO_PADDING * 2 - PHOTO_GAP * 2) / 3);

export default function ProfileScreen() {
  const { user, profile, isDevAdmin, signOut } = useAuth();
  const { theme, mode, preference, setPreference } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { blockedUsers } = useBlockedUsers();
  const { isPremium, premiumExpiry, dailyLikesUsed, dailyHisUsed } = usePremium();
  const { balance: tokenBalance } = useCoins();
  const router = useRouter();
  const c = theme.colors;

  const { posts: myPosts, deletePost, archivePost, editPost } = usePosts(user?.uid);
  const { totalUnread: unreadTickets, tickets } = useMyTickets();
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  function calcAge(birthDate?: string): string {
    if (!birthDate) return "";
    const parts = birthDate.split(".");
    if (parts.length !== 3) return "";
    const dob = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return isNaN(age) ? "" : `${age}`;
  }

  function handleLogout() {
    showAlert(t("profile_logout_title"), t("profile_logout_confirm"), [
      { text: t("common_cancel"), style: "cancel" },
      { text: t("profile_logout_title"), style: "destructive", onPress: () => signOut() },
    ]);
  }

  const age = calcAge(profile?.birthDate);
  const displayName = profile?.name ?? user?.displayName ?? t("profile_user_fallback");
  const photo = profile?.photoURL;
  const extraPhotos = profile?.photos ?? [];
  const photoCount = (photo ? 1 : 0) + extraPhotos.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 110 : 90 }}
      >
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={[c.primary, c.primaryDark]}
          style={styles.hero}
        >
          {/* Avatar */}
          <Pressable onPress={() => router.push("/profile/edit")} style={styles.avatarWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase() ?? "?"}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>

          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>
              {displayName}
              {age ? `, ${age}` : ""}
            </Text>
            {profile?.verified && (
              <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
            )}
            {isPremium && (
              <View style={styles.vipBadge}>
                <Ionicons name="diamond" size={10} color="#000" />
                <Text style={styles.vipBadgeText}>VIP</Text>
              </View>
            )}
          </View>

          {profile?.city ? (
            <View style={styles.heroCityRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroCity}>{profile.city}</Text>
            </View>
          ) : null}

          {isDevAdmin && (
            <View style={styles.devBadge}>
              <Ionicons name="code-slash" size={11} color="#fff" />
              <Text style={styles.devBadgeText}>DEV ADMIN</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatItem label={t("profile_photo_count")} value={String(photoCount)} />
            <View style={styles.statDivider} />
            <StatItem label={t("profile_interest_count")} value={String(profile?.interests?.length ?? 0)} />
            <View style={styles.statDivider} />
            <StatItem
              label={t("profile_membership")}
              value={isPremium ? "VIP ✦" : (profile?.profileComplete ? t("profile_membership_standard") : t("profile_membership_incomplete"))}
            />
          </View>
        </LinearGradient>

        {/* ── Profili Düzenle Butonu ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.editBtnWrap}>
          <Pressable
            onPress={() => router.push("/profile/edit")}
            style={[styles.editBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Ionicons name="create-outline" size={18} color={c.primary} />
            <Text style={[styles.editBtnText, { color: c.primary }]}>{t("profile_edit")}</Text>
          </Pressable>
        </Animated.View>

        {/* ── Premium & Jeton Kartları ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(350)}>
        <View style={styles.quickCardsRow}>
          {/* Premium kart */}
          <Pressable
            onPress={() => router.push("/premium")}
            style={[styles.quickCard, { backgroundColor: isPremium ? `${c.secondary}18` : c.card, borderColor: isPremium ? `${c.secondary}40` : c.border }]}
          >
            <LinearGradient
              colors={isPremium ? ["#D4AF3720", "#D4AF3705"] : ["transparent", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.quickCardIcon, { backgroundColor: `${c.secondary}20` }]}>
              <Ionicons name="diamond" size={18} color={c.secondary} />
            </View>
            <View style={styles.quickCardTexts}>
              <Text style={[styles.quickCardLabel, { color: c.textMuted }]}>Premium</Text>
              {isPremium ? (
                <Text style={[styles.quickCardValue, { color: c.secondary }]}>
                  {t("profile_vip_active")}
                </Text>
              ) : (
                <Text style={[styles.quickCardValue, { color: c.text }]}>
                  {t("profile_get_premium")}
                </Text>
              )}
              {isPremium && premiumExpiry && (
                <Text style={[styles.quickCardSub, { color: c.textMuted }]}>
                  {t("profile_until", { date: premiumExpiry.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US") })}
                </Text>
              )}
              {!isPremium && (
                <Text style={[styles.quickCardSub, { color: c.textMuted }]}>
                  {t("profile_likes_remaining", { remaining: String(10 - dailyLikesUsed), total: "10" })}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>

          {/* Jeton kart */}
          <Pressable
            onPress={() => router.push("/premium/coins")}
            style={[styles.quickCard, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={[styles.quickCardIcon, { backgroundColor: "rgba(245,158,11,0.15)" }]}>
              <Text style={{ fontSize: 18 }}>🪙</Text>
            </View>
            <View style={styles.quickCardTexts}>
              <Text style={[styles.quickCardLabel, { color: c.textMuted }]}>{t("profile_my_tokens")}</Text>
              <Text style={[styles.quickCardValue, { color: c.text }]}>
                {t("profile_token_count", { count: String(tokenBalance) })}
              </Text>
              <Text style={[styles.quickCardSub, { color: c.textMuted }]}>
                {t("profile_approx_messages", { count: String(Math.floor(tokenBalance / 10)) })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>
        </View>
        </Animated.View>

        {/* ── Bio ── */}
        {profile?.bio ? (
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={[styles.bioCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.bioText, { color: c.text }]}>{profile.bio}</Text>
          </Animated.View>
        ) : null}

        {/* ── Gönderilerim ── */}
        <Animated.View entering={FadeInDown.delay(115).duration(350)}>
          <MyPostsSection
            posts={myPosts}
            onEdit={editPost}
            onArchive={archivePost}
            onDelete={deletePost}
            colors={c}
          />
        </Animated.View>

        {/* ── Fotoğraflar ── */}
        {(photo || extraPhotos.length > 0) && (
          <Animated.View entering={FadeInDown.delay(120).duration(350)}>
            <SectionHeader title={`${t("profile_photos")} (${photoCount})`} c={c} />
            <View style={styles.photosGrid}>
              {[...(photo ? [photo] : []), ...extraPhotos].slice(0, 9).map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.photoGridItem, { width: PHOTO_ITEM_W, height: PHOTO_ITEM_W }]}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Hesap Ayarları ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)}>
          <SectionHeader title={t("settings_account")} c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <RowItem
              icon="mail-outline"
              label={t("settings_email")}
              value={user?.email ?? "—"}
              c={c}
            />
            <Divider c={c} />
            <RowItem
              icon="diamond-outline"
              label={t("settings_plan")}
              value={isPremium ? t("settings_plan_vip") : t("profile_membership_standard")}
              c={c}
            />
          </View>
        </Animated.View>

        {/* ── Görünüm ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)}>
          <SectionHeader title={t("settings_appearance")} c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            {/* Tema seçici */}
            <View style={styles.rowItem}>
              <View style={[styles.rowIcon, { backgroundColor: `${c.primary}18` }]}>
                <Ionicons name="color-palette-outline" size={18} color={c.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: c.text, flex: 1 }]}>{t("settings_theme")}</Text>
            </View>
            <View style={styles.segmentRow}>
              {([
                { key: "system" as ThemePreference, label: t("settings_theme_system"), icon: "phone-portrait-outline" as const },
                { key: "light" as ThemePreference, label: t("settings_theme_light"), icon: "sunny-outline" as const },
                { key: "dark" as ThemePreference, label: t("settings_theme_dark"), icon: "moon-outline" as const },
              ]).map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setPreference(opt.key)}
                  style={[
                    styles.segmentBtn,
                    { borderColor: preference === opt.key ? c.primary : c.border },
                    preference === opt.key && { backgroundColor: `${c.primary}18` },
                  ]}
                >
                  <Ionicons name={opt.icon} size={15} color={preference === opt.key ? c.primary : c.textMuted} />
                  <Text style={[styles.segmentLabel, { color: preference === opt.key ? c.primary : c.textMuted }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {/* Dil seçici */}
            <View style={[styles.rowItem, { marginTop: 8 }]}>
              <View style={[styles.rowIcon, { backgroundColor: `${c.primary}18` }]}>
                <Ionicons name="language-outline" size={18} color={c.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: c.text, flex: 1 }]}>{t("settings_language")}</Text>
            </View>
            <View style={styles.segmentRow}>
              {([
                { key: "tr" as const, label: "Türkçe", flag: "🇹🇷" },
                { key: "en" as const, label: "English", flag: "🇬🇧" },
              ]).map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setLang(opt.key)}
                  style={[
                    styles.segmentBtn,
                    { borderColor: lang === opt.key ? c.primary : c.border, flex: 1 },
                    lang === opt.key && { backgroundColor: `${c.primary}18` },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{opt.flag}</Text>
                  <Text style={[styles.segmentLabel, { color: lang === opt.key ? c.primary : c.textMuted }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Doğrulama ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(350)}>
          <SectionHeader title={t("settings_verification")} c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <NavRow
              icon="shield-checkmark-outline"
              label={t("settings_verify_account")}
              value={
                profile?.verified
                  ? t("settings_verified")
                  : profile?.verificationStatus === "pending"
                  ? t("settings_verification_pending")
                  : profile?.verificationStatus === "rejected"
                  ? t("settings_verification_rejected")
                  : t("settings_verification_hint")
              }
              onPress={() => setVerificationOpen(true)}
              c={c}
            />
          </View>
        </Animated.View>

        {/* ── Gizlilik ve Güvenlik ── */}
        <Animated.View entering={FadeInDown.delay(220).duration(350)}>
          <SectionHeader title={t("settings_privacy")} c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <NavRow
              icon="shield-checkmark-outline"
              label={t("settings_privacy_policy")}
              onPress={() => router.push("/profile/privacy-policy")}
              c={c}
            />
            <Divider c={c} />
            <NavRow
              icon="ban-outline"
              label={t("settings_blocked_users")}
              badge={blockedUsers.length > 0 ? String(blockedUsers.length) : undefined}
              onPress={() => router.push("/profile/blocked-users")}
              c={c}
            />
          </View>
        </Animated.View>

        {/* ── Destek ── */}
        <Animated.View entering={FadeInDown.delay(260).duration(350)}>
          <SectionHeader title={t("settings_support")} c={c} />
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <NavRow
              icon="alert-circle-outline"
              label={t("settings_report")}
              value={t("settings_report_contact")}
              onPress={() => setReportOpen(true)}
              c={c}
            />
            <Divider c={c} />
            <NavRow
              icon="help-circle-outline"
              label={t("settings_help")}
              onPress={() => showAlert(t("common_help"), "destek@eslesbulus.com")}
              c={c}
            />
            <Divider c={c} />
            <NavRow
              icon="mail-outline"
              label={t("settings_tickets")}
              value={tickets.length > 0 ? t("settings_tickets_count", { count: String(tickets.length) }) : t("settings_tickets_none")}
              badge={unreadTickets > 0 ? String(unreadTickets) : undefined}
              onPress={() => router.push("/profile/support-tickets")}
              c={c}
            />
            <Divider c={c} />
            <NavRow
              icon="information-circle-outline"
              label={t("settings_about")}
              value="v1.0.0"
              onPress={() => setAboutOpen(true)}
              c={c}
            />
          </View>
        </Animated.View>

        {/* ── Sorun Bildir Modal ── */}
        <ReportIssueModal
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          colors={c}
        />

        {/* ── Uygulama Hakkında Modal ── */}
        <AboutModal
          visible={aboutOpen}
          onClose={() => setAboutOpen(false)}
          colors={c}
        />

        {/* ── Doğrulama Sheet ── */}
        <VerificationSheet
          visible={verificationOpen}
          onClose={() => setVerificationOpen(false)}
          colors={c}
          currentStatus={
            profile?.verified
              ? "approved"
              : (profile?.verificationStatus === "none" || !profile?.verificationStatus)
              ? "idle"
              : (profile as any).verificationStatus
          }
        />

        {/* ── Çıkış ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(350)} style={styles.logoutWrap}>
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { borderColor: "#E53935" }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#E53935" />
            <Text style={[styles.logoutText, { color: "#E53935" }]}>{t("settings_logout")}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, c }: { title: string; c: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: c.textMuted }]}>{title}</Text>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Divider({ c }: { c: any }) {
  return <View style={[styles.divider, { backgroundColor: c.border }]} />;
}

function RowItem({ icon, label, value, c }: { icon: any; label: string; value: string; c: any }) {
  return (
    <View style={styles.rowItem}>
      <View style={[styles.rowIcon, { backgroundColor: `${c.primary}18` }]}>
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: c.textMuted }]}>{value}</Text>
      </View>
    </View>
  );
}

function NavRow({
  icon,
  label,
  value,
  badge,
  onPress,
  c,
}: {
  icon: any;
  label: string;
  value?: string;
  badge?: string;
  onPress: () => void;
  c: any;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.6 }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${c.primary}18` }]}>
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: c.text, flex: 1 }]} numberOfLines={1}>{label}</Text>
      {value ? (
        <Text
          style={[styles.rowValue, { color: c.textMuted, flexShrink: 1, textAlign: "right", marginLeft: 8 }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

function ReportIssueModal({ visible, onClose, colors: c }: { visible: boolean; onClose: () => void; colors: any }) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  }

  async function handleSend() {
    if (!text.trim()) {
      showAlert(t("common_error"), t("report_empty_error"));
      return;
    }
    setSending(true);
    try {
      let photoUrl = "";
      if (photo) {
        const uploaded = await api.upload("reports", photo, "image");
        photoUrl = uploaded.url;
      }
      await api.post("/api/reports", {
        type: "support",
        reason: t("report_reason"),
        details: text.trim(),
        photo: photoUrl || undefined,
      });
      setText("");
      setPhoto(null);
      onClose();
      showAlert(t("report_success"), t("report_success_desc"));
    } catch (e: any) {
      showAlert(t("common_error"), e?.message ?? t("report_fail"));
    }
    setSending(false);
  }

  function handleClose() {
    setText("");
    setPhoto(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
        <Pressable onPress={handleClose} style={styles.reportOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.reportSheet, { backgroundColor: c.card }]}>
            <View style={[styles.reportHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.reportTitle, { color: c.text }]}>{t("report_title")}</Text>
            <Text style={[styles.reportSubtitle, { color: c.textMuted }]}>
              {t("report_subtitle")}
            </Text>
            <TextInput
              style={[styles.reportInput, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              placeholder={t("report_placeholder")}
              placeholderTextColor={c.textMuted}
              multiline
              value={text}
              onChangeText={setText}
              maxLength={1000}
            />
            {/* Ekran görüntüsü */}
            {photo ? (
              <View style={styles.reportPhotoWrap}>
                <Image source={{ uri: photo }} style={styles.reportPhotoPreview} />
                <Pressable onPress={() => setPhoto(null)} style={[styles.reportPhotoRemove, { backgroundColor: c.primary }]}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handlePickPhoto} style={[styles.reportPhotoBtn, { borderColor: c.border }]}>
                <Ionicons name="image-outline" size={20} color={c.primary} />
                <Text style={{ color: c.primary, fontWeight: "600", fontSize: 14 }}>{t("report_add_screenshot")}</Text>
              </Pressable>
            )}
            <View style={styles.reportActions}>
              <Pressable onPress={handleClose} style={[styles.reportCancelBtn, { borderColor: c.border }]}>
                <Text style={{ color: c.textMuted, fontWeight: "600" }}>{t("common_cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleSend}
                disabled={sending}
                style={[styles.reportSendBtn, { backgroundColor: c.primary, opacity: sending ? 0.6 : 1 }]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{t("report_send")}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function AboutModal({ visible, onClose, colors: c }: { visible: boolean; onClose: () => void; colors: any }) {
  const { t } = useLanguage();
  const infoRows = [
    { icon: "code-slash-outline" as const, label: t("about_version"), value: "1.0.0" },
    { icon: "business-outline" as const, label: t("about_developer"), value: "EşleşBuluş" },
    { icon: "mail-outline" as const, label: t("about_contact"), value: "destek@eslesbulus.com" },
    { icon: "shield-checkmark-outline" as const, label: t("about_privacy"), value: t("about_privacy_value") },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.reportOverlay}>
        <Pressable onPress={(e) => e.stopPropagation()} style={[styles.reportSheet, { backgroundColor: c.card }]}>
          <View style={[styles.reportHandle, { backgroundColor: c.border }]} />
          <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
            <Image source={require("@/assets/icon.png")} style={{ width: 64, height: 64, borderRadius: 20 }} />
            <Text style={{ fontSize: 22, fontWeight: "800", color: c.text }}>EşleşBuluş</Text>
            <Text style={{ fontSize: 13, color: c.textMuted }}>{t("about_slogan")}</Text>
          </View>
          <View style={{ paddingHorizontal: 16, gap: 1 }}>
            {infoRows.map((row, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: i < infoRows.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: c.border }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${c.primary}12`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name={row.icon} size={17} color={c.primary} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: c.text }}>{row.label}</Text>
                <Text style={{ fontSize: 14, color: c.textMuted }}>{row.value}</Text>
              </View>
            ))}
          </View>
          <View style={{ alignItems: "center", paddingVertical: 20, gap: 4 }}>
            <Text style={{ fontSize: 11, color: c.textMuted }}>{t("about_rights")}</Text>
            <Text style={{ fontSize: 11, color: c.textMuted }}>2024-2025 EşleşBuluş</Text>
          </View>
          <Pressable onPress={onClose} style={{ alignSelf: "center", paddingVertical: 12, paddingHorizontal: 32, backgroundColor: c.primary, borderRadius: 14, marginBottom: 16 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t("common_close")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  hero: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroActions: {
    position: "absolute",
    top: 12,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  heroBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarWrap: { position: "relative", marginTop: 16, marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "rgba(255,255,255,0.8)" },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 40, color: "#fff", fontWeight: "bold" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 0 },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  vipBadgeText: { color: "#000", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  heroCityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  heroCity: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  devBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  devBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },

  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    width: "100%",
    paddingHorizontal: 24,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },

  // Quick cards (premium + jeton)
  quickCardsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  quickCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
  },
  quickCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardTexts: { flex: 1 },
  quickCardLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 1 },
  quickCardValue: { fontSize: 13, fontWeight: "700" },
  quickCardSub: { fontSize: 10, marginTop: 1 },

  editBtnWrap: { paddingHorizontal: 16, marginTop: 16 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  editBtnText: { fontWeight: "700", fontSize: 15 },

  bioCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bioText: { fontSize: 15, lineHeight: 22 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },

  group: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { height: 1, marginLeft: 56 },

  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowValue: { fontSize: 13 },

  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
    marginBottom: 8,
    paddingHorizontal: PHOTO_PADDING,
  },
  photoGridItem: {
    // width & height set dynamically via PHOTO_ITEM_W
    borderRadius: 12,
    backgroundColor: "#222",
    resizeMode: "cover",
  },

  segmentRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  segmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  segmentLabel: {
    fontSize: 12.5,
    fontWeight: "600",
  },

  logoutWrap: { paddingHorizontal: 16, marginTop: 24 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },

  // Sorun Bildir Modal
  reportOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  reportSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingBottom: 32 },
  reportHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginVertical: 10 },
  reportTitle: { fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 4 },
  reportSubtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 24, marginBottom: 12 },
  reportInput: { marginHorizontal: 16, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top", marginBottom: 12 },
  reportPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 12, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed" },
  reportPhotoWrap: { marginHorizontal: 16, marginBottom: 12, position: "relative", alignSelf: "flex-start" },
  reportPhotoPreview: { width: 120, height: 120, borderRadius: 12 },
  reportPhotoRemove: { position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  reportActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  reportCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  reportSendBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
});
