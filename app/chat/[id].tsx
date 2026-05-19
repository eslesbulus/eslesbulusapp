import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { getUserById, MockUser } from "@/constants/mockUsers";

type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  status?: "sent" | "delivered" | "read";
};

// Each conversation gets a different mock seed based on userId
function buildMockChat(user: MockUser): Message[] {
  const intros: Record<string, Message[]> = {
    default: [
      { id: "m1", text: `Selam ${user.name}! 👋`, fromMe: true, time: "14:02", status: "read" },
      { id: "m2", text: "Profilini gördüm, çok ilgi çekici", fromMe: true, time: "14:02", status: "read" },
      { id: "m3", text: "Selam! Çok teşekkürler 😊", fromMe: false, time: "14:08" },
      { id: "m4", text: "Sen nasılsın?", fromMe: false, time: "14:08" },
      { id: "m5", text: "İyiyim, sağ ol. Hafta sonu planın var mı?", fromMe: true, time: "14:15", status: "read" },
      { id: "m6", text: "Cumartesi arkadaşlarla brunch düşünüyorum, sen?", fromMe: false, time: "14:22" },
      { id: "m7", text: "Bir şey planlamamıştım", fromMe: true, time: "14:24", status: "read" },
      { id: "m8", text: "Belki kahve içebiliriz?", fromMe: true, time: "14:24", status: "delivered" },
    ],
  };
  return intros.default;
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = getUserById(id ?? "");
  const router = useRouter();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>(() =>
    user ? buildMockChat(user) : []
  );
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  function handleSend() {
    if (!text.trim() || !user) return;
    const msg: Message = {
      id: `m_${Date.now()}`,
      text: text.trim(),
      fromMe: true,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };
    setMessages((prev) => [...prev, msg]);
    setText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    // Mock typing then reply
    setTimeout(() => setTyping(true), 800);
    setTimeout(() => {
      setTyping(false);
      const replies = [
        "İlginç 🤔",
        "Anladım!",
        "Haklısın aslında",
        "Bence de 😊",
        "Daha anlat?",
        "Hahaha",
        "Süper",
      ];
      const reply: Message = {
        id: `m_r_${Date.now()}`,
        text: replies[Math.floor(Math.random() * replies.length)],
        fromMe: false,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }, 2400);
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: c.text }]}>Kullanıcı bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border, backgroundColor: c.card }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>

        <Pressable
          style={styles.userBlock}
          onPress={() => router.push(`/user/${user.id}`)}
        >
          <View style={styles.headerAvatarWrap}>
            <Image source={{ uri: user.photo }} style={styles.headerAvatar} />
            {user.online && <View style={[styles.dot, { backgroundColor: c.online, borderColor: c.card }]} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerName, { color: c.text }]}>{user.name}</Text>
            <Text style={[styles.headerStatus, { color: user.online ? c.online : c.textMuted }]}>
              {typing ? "yazıyor..." : user.online ? "çevrimiçi" : `son görülme ${user.lastActive ?? "bilinmiyor"}`}
            </Text>
          </View>
        </Pressable>

        <Pressable hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="videocam-outline" size={22} color={c.text} />
        </Pressable>
        <Pressable hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="call-outline" size={20} color={c.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeIn.duration(400)} style={styles.matchedCard}>
              <Image source={{ uri: user.photo }} style={styles.matchedAvatar} />
              <Text style={[styles.matchedText, { color: c.text }]}>
                <Text style={{ fontWeight: "700" }}>{user.name} </Text>
                ile eşleştiniz
              </Text>
              <Text style={[styles.matchedSub, { color: c.textMuted }]}>
                Selam de, sohbet başlasın
              </Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => {
            const prev = messages[index - 1];
            const next = messages[index + 1];
            const isFirstOfGroup = !prev || prev.fromMe !== item.fromMe;
            const isLastOfGroup = !next || next.fromMe !== item.fromMe;
            return (
              <Bubble
                msg={item}
                isFirstOfGroup={isFirstOfGroup}
                isLastOfGroup={isLastOfGroup}
                avatar={item.fromMe ? null : user.photo}
                colors={c}
              />
            );
          }}
          ListFooterComponent={
            typing ? (
              <Animated.View entering={FadeInUp.duration(220)} style={styles.typingRow}>
                <Image source={{ uri: user.photo }} style={styles.typingAvatar} />
                <View style={[styles.typingBubble, { backgroundColor: c.surface }]}>
                  <TypingDots color={c.textMuted} />
                </View>
              </Animated.View>
            ) : null
          }
        />

        {/* Input */}
        <View style={[styles.inputBar, { borderTopColor: c.border, backgroundColor: c.card, paddingBottom: Math.max(insets.bottom - 6, 8) }]}>
          <Pressable hitSlop={6} style={styles.iconBtn}>
            <Ionicons name="add-circle" size={28} color={c.primary} />
          </Pressable>
          <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <TextInput
              style={[styles.input, { color: c.text }]}
              placeholder="Mesaj"
              placeholderTextColor={c.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <Pressable hitSlop={6} style={styles.emojiBtn}>
              <Ionicons name="happy-outline" size={22} color={c.textMuted} />
            </Pressable>
          </View>
          {text.trim().length > 0 ? (
            <Pressable
              onPress={handleSend}
              style={[styles.sendBtn, { backgroundColor: c.primary }]}
            >
              <Ionicons name="send" size={17} color="#fff" />
            </Pressable>
          ) : (
            <Pressable hitSlop={6} style={styles.iconBtn}>
              <Ionicons name="mic" size={26} color={c.primary} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({
  msg,
  isFirstOfGroup,
  isLastOfGroup,
  avatar,
  colors: c,
}: {
  msg: Message;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  avatar: string | null;
  colors: any;
}) {
  const fromMe = msg.fromMe;
  const tailRadius = 6;
  const fullRadius = 18;

  const bubbleRadius = fromMe
    ? {
        borderTopLeftRadius: fullRadius,
        borderTopRightRadius: isFirstOfGroup ? fullRadius : tailRadius,
        borderBottomRightRadius: isLastOfGroup ? tailRadius : fullRadius,
        borderBottomLeftRadius: fullRadius,
      }
    : {
        borderTopRightRadius: fullRadius,
        borderTopLeftRadius: isFirstOfGroup ? fullRadius : tailRadius,
        borderBottomLeftRadius: isLastOfGroup ? tailRadius : fullRadius,
        borderBottomRightRadius: fullRadius,
      };

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[
        styles.bubbleRow,
        fromMe ? styles.bubbleRowMe : styles.bubbleRowOther,
        { marginTop: isFirstOfGroup ? 8 : 2, marginBottom: isLastOfGroup ? 4 : 1 },
      ]}
    >
      {!fromMe && (
        <View style={styles.bubbleAvatarSlot}>
          {isLastOfGroup && avatar ? (
            <Image source={{ uri: avatar }} style={styles.bubbleAvatar} />
          ) : null}
        </View>
      )}

      <View
        style={[
          styles.bubble,
          fromMe
            ? { backgroundColor: c.primary, alignSelf: "flex-end" }
            : { backgroundColor: c.surface, alignSelf: "flex-start" },
          bubbleRadius,
        ]}
      >
        <Text style={[styles.bubbleText, { color: fromMe ? "#fff" : c.text }]}>{msg.text}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.bubbleTime, { color: fromMe ? "rgba(255,255,255,0.7)" : c.textMuted }]}>
            {msg.time}
          </Text>
          {fromMe && msg.status && (
            <Ionicons
              name={msg.status === "read" ? "checkmark-done" : "checkmark"}
              size={14}
              color={msg.status === "read" ? "#7DD3FC" : "rgba(255,255,255,0.7)"}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function TypingDots({ color }: { color: string }) {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    const loop = (v: SharedValue<number>, delay: number) => {
      v.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    };
    loop(d1, 0);
    loop(d2, 150);
    loop(d3, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value, transform: [{ scale: 0.7 + d1.value * 0.5 }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value, transform: [{ scale: 0.7 + d2.value * 0.5 }] }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value, transform: [{ scale: 0.7 + d3.value * 0.5 }] }));

  return (
    <View style={styles.dotsWrap}>
      <Animated.View style={[styles.typingDot, { backgroundColor: color }, s1]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: color }, s2]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: color }, s3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  backBtn: { padding: 6 },
  userBlock: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  headerAvatarWrap: { position: "relative" },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  dot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  headerName: { fontSize: 15, fontWeight: "700" },
  headerStatus: { fontSize: 11.5, marginTop: 1 },
  headerBtn: { padding: 8 },

  list: { paddingHorizontal: 10, paddingVertical: 12 },

  matchedCard: {
    alignItems: "center",
    paddingVertical: 22,
    gap: 8,
  },
  matchedAvatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 6 },
  matchedText: { fontSize: 15, textAlign: "center" },
  matchedSub: { fontSize: 13, marginTop: -2 },

  bubbleRow: {
    flexDirection: "row",
    paddingHorizontal: 2,
    alignItems: "flex-end",
  },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowOther: { justifyContent: "flex-start" },
  bubbleAvatarSlot: { width: 28, alignItems: "center", justifyContent: "flex-end" },
  bubbleAvatar: { width: 24, height: 24, borderRadius: 12 },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 6,
    marginHorizontal: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 3,
    marginTop: 2,
  },
  bubbleTime: { fontSize: 10.5 },

  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingLeft: 4,
    marginTop: 4,
  },
  typingAvatar: { width: 24, height: 24, borderRadius: 12 },
  typingBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  dotsWrap: { flexDirection: "row", gap: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, paddingBottom: 8 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
    minHeight: 40,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 7 },
  emojiBtn: { padding: 6 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
