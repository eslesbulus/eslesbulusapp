import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

const EMOJIS = ["❤️", "🔥", "😂", "😮", "😍", "👏"];

type Props = {
  userName: string;
  onSend: (kind: "emoji" | "message", payload: string) => void;
  onFocusInput?: () => void;
  onBlurInput?: () => void;
};

export function StoryReactions({ userName, onSend, onFocusInput, onBlurInput }: Props) {
  const [text, setText] = useState("");
  const [popEmoji, setPopEmoji] = useState<string | null>(null);
  const popScale = useSharedValue(0);
  const popOpacity = useSharedValue(0);

  function flyEmoji(e: string) {
    setPopEmoji(e);
    popScale.value = 0;
    popOpacity.value = 0;
    popScale.value = withSequence(
      withTiming(1.6, { duration: 280 }),
      withDelay(180, withTiming(2.2, { duration: 350 }))
    );
    popOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(220, withTiming(0, { duration: 280 }))
    );
    onSend("emoji", e);
  }

  function sendText() {
    const t = text.trim();
    if (!t) return;
    setText("");
    Keyboard.dismiss();
    onSend("message", t);
  }

  const popStyle = useAnimatedStyle(() => ({
    opacity: popOpacity.value,
    transform: [{ scale: popScale.value }],
  }));

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {popEmoji && (
        <Animated.View pointerEvents="none" style={[styles.popWrap, popStyle]}>
          <Text style={styles.popEmoji}>{popEmoji}</Text>
        </Animated.View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`${userName} kullanıcısına mesaj…`}
          placeholderTextColor="rgba(255,255,255,0.55)"
          style={styles.input}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          onSubmitEditing={sendText}
          returnKeyType="send"
          maxLength={200}
        />
        {text.trim().length > 0 ? (
          <Pressable
            onPress={sendText}
            style={({ pressed }) => [styles.sendBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.emojiRow}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => flyEmoji(e)}
            style={({ pressed }) => [
              styles.emojiBtn,
              { transform: [{ scale: pressed ? 0.85 : 1 }] },
            ]}
            hitSlop={6}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, gap: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 10,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#800020",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 28 },

  popWrap: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  popEmoji: { fontSize: 56 },
});
