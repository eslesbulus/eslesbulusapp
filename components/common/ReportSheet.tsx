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

const { height: H } = Dimensions.get("window");

const REPORT_REASONS = [
  { id: "inappropriate", label: "Uygunsuz içerik", icon: "warning-outline" as const },
  { id: "spam", label: "Spam", icon: "alert-circle-outline" as const },
  { id: "fake", label: "Sahte profil", icon: "person-remove-outline" as const },
  { id: "harassment", label: "Taciz / Zorbalık", icon: "hand-left-outline" as const },
  { id: "other", label: "Diğer", icon: "ellipsis-horizontal-circle-outline" as const },
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
      blockUser({ id: targetId, name: targetName, photo: targetPhoto ?? "", online: false, photos: [], age: 0, gender: "erkek", city: "", vip: false, verified: false, hasStory: false, bio: "", interests: [] });
      Alert.alert("Engellendi", `${targetName} engellendi.`);
      onBlock?.();
    }
  }

  function handleReport(reason: string) {
    setStep("done");
    setTimeout(() => {
      handleClose();
      Alert.alert("Şikayet Alındı", "Şikayetin incelemeye alındı. Teşekkürler.");
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
              {targetName ? `@${targetName}` : "Gönderi"}
            </Text>

            {type === "user" && (
              <SheetItem
                icon="ban-outline"
                label="Engelle"
                color="#E53935"
                onPress={handleBlock}
                c={c}
              />
            )}
            <SheetItem
              icon="flag-outline"
              label={type === "user" ? "Kullanıcıyı Şikayet Et" : "Gönderiyi Şikayet Et"}
              color={c.primary}
              onPress={() => setStep("reasons")}
              c={c}
            />
            <SheetItem
              icon="close-circle-outline"
              label="İptal"
              color={c.textMuted}
              onPress={handleClose}
              c={c}
            />
          </>
        )}

        {step === "reasons" && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Şikayet Sebebi</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              Bu {type === "user" ? "hesabı" : "gönderiyi"} neden şikayet ediyorsun?
            </Text>
            {REPORT_REASONS.map((r) => (
              <SheetItem
                key={r.id}
                icon={r.icon}
                label={r.label}
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
            <Text style={[styles.doneTitle, { color: c.text }]}>Şikayet Gönderildi</Text>
            <Text style={[styles.doneDesc, { color: c.textMuted }]}>
              İncelemeye alındı, teşekkürler.
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
