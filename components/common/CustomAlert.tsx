import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const { width: W } = Dimensions.get("window");

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
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

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (_listener) {
    _listener({ title, message, buttons });
  }
}

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
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
    return () => { _listener = null; };
  }, [handleShow]);

  function handleButton(btn?: AlertButton) {
    setVisible(false);
    setTimeout(() => {
      btn?.onPress?.();
      setConfig(null);
    }, 200);
  }

  if (!config) {
    return <>{children}</>;
  }

  const buttons = config.buttons ?? [{ text: "OK", style: "default" }];
  const hasCancel = buttons.some((b) => b.style === "cancel");
  const tl = config.title?.toLowerCase() ?? "";

  const iconName = config.icon ?? (
    tl.includes("hata") || tl.includes("başarısız") || tl.includes("error") || tl.includes("failed") ? "alert-circle" :
    tl.includes("başarı") || tl.includes("gönderildi") || tl.includes("paylaşıldı") || tl.includes("kaydedildi") || tl.includes("tamamlandı") || tl.includes("alındı") || tl.includes("doğrulandı") || tl.includes("success") || tl.includes("sent") || tl.includes("received") || tl.includes("verified") || tl.includes("activated") ? "checkmark-circle" :
    tl.includes("uyarı") || tl.includes("dikkat") || tl.includes("limit") || tl.includes("warning") || tl.includes("reached") ? "warning" :
    tl.includes("çıkış") || tl.includes("sil") || tl.includes("engel") || tl.includes("log out") || tl.includes("delete") || tl.includes("block") ? "warning" :
    tl.includes("izin") || tl.includes("permission") ? "lock-closed" :
    tl.includes("jeton") || tl.includes("yetersiz") || tl.includes("token") || tl.includes("insufficient") ? "wallet" :
    "information-circle"
  );

  const iconColor = config.iconColor ?? (
    tl.includes("hata") || tl.includes("başarısız") || tl.includes("error") || tl.includes("failed") ? "#EF4444" :
    tl.includes("başarı") || tl.includes("gönderildi") || tl.includes("paylaşıldı") || tl.includes("kaydedildi") || tl.includes("tamamlandı") || tl.includes("alındı") || tl.includes("doğrulandı") || tl.includes("success") || tl.includes("sent") || tl.includes("received") || tl.includes("verified") || tl.includes("activated") ? "#22C55E" :
    tl.includes("uyarı") || tl.includes("dikkat") || tl.includes("limit") || tl.includes("yetersiz") || tl.includes("warning") || tl.includes("reached") || tl.includes("insufficient") ? "#F59E0B" :
    tl.includes("çıkış") || tl.includes("sil") || tl.includes("engel") || tl.includes("log out") || tl.includes("delete") || tl.includes("block") ? "#EF4444" :
    tl.includes("izin") || tl.includes("permission") ? "#F59E0B" :
    c.primary
  );

  return (
    <>
      {children}
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => handleButton()}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!hasCancel) handleButton(); }} />
          <Animated.View entering={ZoomIn.duration(250).springify().damping(28).stiffness(200)} exiting={ZoomOut.duration(150)} style={[styles.card, { backgroundColor: c.card }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
              <Ionicons name={iconName as any} size={36} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: c.text }]}>{config.title}</Text>
            {config.message ? (
              <Text style={[styles.message, { color: c.textMuted }]}>{config.message}</Text>
            ) : null}
            <View style={[styles.buttonRow, buttons.length === 1 && styles.buttonRowSingle]}>
              {buttons.map((btn, i) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                return (
                  <Pressable
                    key={i}
                    onPress={() => handleButton(btn)}
                    style={({ pressed }) => [
                      styles.button,
                      buttons.length > 1 && { flex: 1 },
                      isCancel
                        ? { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }
                        : isDestructive
                        ? { backgroundColor: "#EF4444" }
                        : { backgroundColor: c.primary },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel ? { color: c.text } : { color: "#fff" },
                      ]}
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
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    width: Math.min(W - 48, 340),
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  buttonRowSingle: {
    justifyContent: "center",
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    minWidth: 100,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
