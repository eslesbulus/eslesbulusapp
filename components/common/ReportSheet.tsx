import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  Alert,
  Dimensions,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useBlockedUsers } from "@/context/BlockedUsersContext";
import { api } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";

const { height: H } = Dimensions.get("window");

const REPORT_REASON_KEYS = [
  { id: "inappropriate", key: "report_sheet_reason_inappropriate", icon: "warning-outline" as const },
  { id: "spam", key: "report_sheet_reason_spam", icon: "alert-circle-outline" as const },
  { id: "fake", key: "report_sheet_reason_fake", icon: "person-remove-outline" as const },
  { id: "harassment", key: "report_sheet_reason_harassment", icon: "hand-left-outline" as const },
  { id: "other", key: "report_sheet_reason_other", icon: "ellipsis-horizontal-circle-outline" as const },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  type: "user" | "post";
  targetName?: string;
  targetId?: string;
  targetPhoto?: string;
  onBlock?: () => void;
};

export function ReportSheet({ visible, onClose, type, targetName, targetId, targetPhoto, onBlock }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { blockUser } = useBlockedUsers();
  const { t } = useLanguage();

  const [step, setStep] = useState<"menu" | "reasons" | "done">("menu");
  const [mounted, setMounted] = useState(visible);

  const translateY = useSharedValue(H);
  const backdrop = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  useEffect(() => {
    if (visible) {
      setStep("menu");
      setMounted(true);
      backdrop.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 340, easing: Easing.out(Easing.exp) });
    } else {
      backdrop.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(H, { duration: 240, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  function handleClose() {
    onClose();
    setTimeout(() => setStep("menu"), 400);
  }

  function handleBlock() {
    handleClose();
    if (targetId && targetName && targetPhoto !== undefined) {
      blockUser({ uid: targetId, name: targetName, photoURL: targetPhoto ?? "" });
      showAlert(t("report_sheet_blocked"), t("report_sheet_blocked_desc", { name: targetName }));
      onBlock?.();
    }
  }

  async function handleReport(reason: string) {
    // Backend'e gerçekten gönder — admin panel /reports listesine düşer.
    // Optimistik olarak "done" ekranını göster; hata olursa bilgilendir.
    setStep("done");
    try {
      await api.post("/api/reports", {
        type,
        reason,
        reportedUid: type === "user" ? targetId : undefined,
        reportedPostId: type === "post" ? targetId : undefined,
      });
    } catch (e: any) {
      handleClose();
      showAlert(t("report_sheet_error"), e?.message ?? t("report_sheet_error"));
      return;
    }
    setTimeout(() => {
      handleClose();
      showAlert(t("report_sheet_success_title"), t("report_sheet_success_desc"));
    }, 1000);
  }

  if (!mounted) return null;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]} pointerEvents="auto">
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[styles.sheet, { backgroundColor: c.card }, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
        </View>

        {step === "menu" && (
          <>
            <Text style={[styles.title, { color: c.text }]}>
              {targetName ? `@${targetName}` : t("report_sheet_fallback_name")}
            </Text>

            {type === "user" && (
              <SheetItem
                icon="ban-outline"
                label={t("report_sheet_block")}
                color="#E53935"
                onPress={handleBlock}
                c={c}
              />
            )}
            <SheetItem
              icon="flag-outline"
              label={type === "user" ? t("report_sheet_report_user") : t("report_sheet_report_post")}
              color={c.primary}
              onPress={() => setStep("reasons")}
              c={c}
            />
            <SheetItem
              icon="close-circle-outline"
              label={t("common_cancel")}
              color={c.textMuted}
              onPress={handleClose}
              c={c}
            />
          </>
        )}

        {step === "reasons" && (
          <>
            <Text style={[styles.title, { color: c.text }]}>{t("report_sheet_reason_title")}</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              {t("report_sheet_reason_desc", { type })}
            </Text>
            {REPORT_REASON_KEYS.map((r) => (
              <SheetItem
                key={r.id}
                icon={r.icon}
                label={t(r.key as any)}
                color={c.text}
                onPress={() => handleReport(r.id)}
                c={c}
              />
            ))}
          </>
        )}

        {step === "done" && (
          <View style={styles.doneWrap}>
            <View style={[styles.doneIcon, { backgroundColor: `${c.primary}15` }]}>
              <Ionicons name="checkmark-circle" size={44} color={c.primary} />
            </View>
            <Text style={[styles.doneTitle, { color: c.text }]}>{t("report_sheet_done_title")}</Text>
            <Text style={[styles.doneDesc, { color: c.textMuted }]}>
              {t("report_sheet_done_desc")}
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </Animated.View>
    </Modal>
  );
}

function SheetItem({
  icon,
  label,
  color,
  onPress,
  c,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
  c: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { borderBottomColor: c.border, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.itemIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 4,
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  title: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: { fontSize: 15, fontWeight: "600" },
  doneWrap: { alignItems: "center", paddingVertical: 32, gap: 12 },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: { fontSize: 18, fontWeight: "800" },
  doneDesc: { fontSize: 14, textAlign: "center" },
});
