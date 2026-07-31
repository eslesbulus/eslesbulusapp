import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

const { width: W } = Dimensions.get("window");
const CARD_WIDTH = Math.min(W - 48, 320);

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type AlertConfig = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons?: AlertButton[];
};

type Listener = (cfg: AlertConfig) => void;
let _listener: Listener | null = null;

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
) {
  _listener?.({ title, message, buttons });
}

export function CustomAlertProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const handleShow = useCallback((cfg: AlertConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  useEffect(() => {
    _listener = handleShow;
    return () => {
      _listener = null;
    };
  }, [handleShow]);

  function handleButton(btn?: AlertButton) {
    setVisible(false);
    setTimeout(() => {
      btn?.onPress?.();
      setConfig(null);
    }, 200);
  }

  if (!config) return <>{children}</>;

  const buttons = config.buttons ?? [{ text: "OK", style: "default" as const }];
  const hasCancel = buttons.some((b) => b.style === "cancel");

  const tl = config.title?.toLowerCase() ?? "";

  const iconName: keyof typeof Ionicons.glyphMap =
    config.icon ??
    (tl.includes("hata") || tl.includes("error") || tl.includes("failed")
      ? "close-circle"
      : tl.includes("başarı") ||
        tl.includes("gönderildi") ||
        tl.includes("tamamlandı") ||
        tl.includes("alındı") ||
        tl.includes("success") ||
        tl.includes("sent") ||
        tl.includes("received")
      ? "checkmark-circle"
      : tl.includes("limit") || tl.includes("reached") || tl.includes("doldu")
      ? "timer-outline"
      : tl.includes("uyarı") ||
        tl.includes("dikkat") ||
        tl.includes("warning")
      ? "warning"
      : tl.includes("çıkış") ||
        tl.includes("sil") ||
        tl.includes("engel") ||
        tl.includes("delete") ||
        tl.includes("block")
      ? "warning"
      : tl.includes("jeton") ||
        tl.includes("yetersiz") ||
        tl.includes("token") ||
        tl.includes("insufficient")
      ? "wallet-outline"
      : "information-circle");

  const accentColor =
    config.iconColor ??
    (tl.includes("hata") || tl.includes("error")
      ? "#EF4444"
      : tl.includes("başarı") ||
        tl.includes("gönderildi") ||
        tl.includes("tamamlandı") ||
        tl.includes("alındı") ||
        tl.includes("success") ||
        tl.includes("sent") ||
        tl.includes("received")
      ? "#22C55E"
      : tl.includes("limit") || tl.includes("doldu") || tl.includes("reached")
      ? c.secondary
      : tl.includes("çıkış") ||
        tl.includes("sil") ||
        tl.includes("engel") ||
        tl.includes("delete") ||
        tl.includes("block")
      ? "#EF4444"
      : c.primary);

  const isPremiumAction = buttons.some(
    (b) =>
      b.style !== "cancel" &&
      (b.text.toLowerCase().includes("premium") ||
        b.text.toLowerCase().includes("upgrade"))
  );

  return (
    <>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => handleButton()}
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={styles.backdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!hasCancel) handleButton();
            }}
          />

          <Animated.View
            entering={ZoomIn.duration(260).springify().damping(22).stiffness(180)}
            exiting={ZoomOut.duration(150)}
            style={[styles.card, { backgroundColor: c.card }]}
          >
            {/* Top accent line */}
            <View
              style={[styles.accentLine, { backgroundColor: accentColor }]}
            />

            {/* Icon area */}
            <View style={styles.iconSection}>
              <LinearGradient
                colors={[`${accentColor}28`, `${accentColor}08`]}
                style={styles.iconRing}
              >
                <View
                  style={[
                    styles.iconInner,
                    { backgroundColor: `${accentColor}18` },
                  ]}
                >
                  <Ionicons name={iconName} size={32} color={accentColor} />
                </View>
              </LinearGradient>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.title, { color: c.text }]}>
                {config.title}
              </Text>
              {config.message ? (
                <Text style={[styles.message, { color: c.textMuted }]}>
                  {config.message}
                </Text>
              ) : null}
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: c.border }]} />

            {/* Buttons */}
            <View style={styles.buttonArea}>
              {buttons.map((btn, i) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                const isPrimary = !isCancel && !isDestructive;
                const btnColor = isDestructive
                  ? "#EF4444"
                  : isPrimary && isPremiumAction
                  ? c.secondary
                  : c.primary;

                return (
                  <Pressable
                    key={i}
                    onPress={() => handleButton(btn)}
                    style={({ pressed }) => [
                      styles.button,
                      isCancel
                        ? [
                            styles.cancelBtn,
                            {
                              borderColor: c.border,
                              backgroundColor: c.surface,
                            },
                          ]
                        : [styles.primaryBtn, { backgroundColor: btnColor }],
                      pressed && { opacity: 0.82 },
                    ]}
                  >
                    {btn.icon && (
                      <Ionicons
                        name={btn.icon}
                        size={16}
                        color={isCancel ? c.text : "#fff"}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    {isPrimary && isPremiumAction && !btn.icon && (
                      <Ionicons
                        name="diamond-outline"
                        size={15}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel ? { color: c.textMuted } : { color: "#fff" },
                      ]}
                      numberOfLines={1}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 16,
  },
  accentLine: {
    height: 3,
    width: "100%",
  },
  iconSection: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 4,
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
  },
  buttonArea: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 13,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  primaryBtn: {},
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
});
