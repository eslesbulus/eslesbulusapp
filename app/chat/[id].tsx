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
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
import { Gift } from "@/constants/gifts";
import { GiftSheet } from "@/components/chat/GiftSheet";
import { GiftAnimation } from "@/components/chat/GiftAnimation";
import { EmojiPicker } from "@/components/chat/EmojiPicker";

type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  status?: "sent" | "delivered" | "read";
  gift?: Gift; // if message is a gift
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
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState<Gift | null>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  function handleSendGift(g: Gift) {
    setActiveGiftAnim(g);
    const msg: Message = {
      id: `m_g_${Date.now()}`,
      text: `🎁 ${g.name}`,
      fromMe: true,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      gift: g,
    };
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    // Mock reply with thanks after gift
    setTimeout(() => setTyping(true), 1800);
    setTimeout(() => {
      setTyping(false);
      const reply: Message = {
        id: `m_gr_${Date.now()}`,
        text: `Çok teşekkürler! ${g.emoji}😍`,
        fromMe: false,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }, 3600);
  }

  function handlePickEmoji(emoji: string) {
    setText((t) => t + emoji);
  }

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

        <Pressable hitSlop={8} style={styles.headerBtn} onPress={() => router.push(`/call/${user.id}?type=video`)}>
          <Ionicons name="videocam-outline" size={22} color={c.text} />
        </Pressable>
        <Pressable hitSlop={8} style={styles.headerBtn} onPress={() => router.push(`/call/${user.id}?type=voice`)}>
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
          <Pressable hitSlop={6} style={styles.iconBtn} onPress={() => { Keyboard.dismiss(); setAttachOpen(true); }}>
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
            <Pressable hitSlop={6} style={styles.emojiBtn} onPress={() => { Keyboard.dismiss(); setEmojiOpen(true); }}>
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

      {/* Attachment Sheet */}
      <Modal
        visible={attachOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachOpen(false)}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          onPress={() => setAttachOpen(false)}
        />
        <View style={styles.attachWrap} pointerEvents="box-none">
          <Animated.View
            entering={FadeInUp.duration(240)}
            style={[styles.attachSheet, { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom + 12, 28) }]}
          >
            <View style={[styles.attachHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.attachTitle, { color: c.text }]}>Paylaş</Text>
            <View style={styles.attachGrid}>
              {[
                { icon: "gift", label: "Hediye", color: "#EC4899" },
                { icon: "camera", label: "Kamera", color: "#7C3AED" },
                { icon: "images", label: "Galeri", color: "#2563EB" },
                { icon: "videocam", label: "Video", color: "#DC2626" },
                { icon: "document-text", label: "Dosya", color: "#D97706" },
                { icon: "location", label: "Konum", color: "#16A34A" },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.attachItem}
                  onPress={async () => {
                    setAttachOpen(false);
                    if (item.icon === "gift") {
                      setTimeout(() => setGiftOpen(true), 220);
                      return;
                    }
                    if (item.icon === "camera") {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== "granted") { Alert.alert("İzin Gerekli", "Kamera izni verilmedi."); return; }
                      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
                      if (!res.canceled) {
                        const msg: Message = { id: `m_${Date.now()}`, text: "📷 Fotoğraf gönderildi", fromMe: true, time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }), status: "sent" };
                        setMessages(p => [...p, msg]);
                        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
                      }
                    } else if (item.icon === "images" || item.icon === "videocam") {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== "granted") { Alert.alert("İzin Gerekli", "Galeri izni verilmedi."); return; }
                      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: item.icon === "videocam" ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
                      if (!res.canceled) {
                        const label = item.icon === "videocam" ? "🎥 Video gönderildi" : "🖼 Fotoğraf gönderildi";
                        const msg: Message = { id: `m_${Date.now()}`, text: label, fromMe: true, time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }), status: "sent" };
                        setMessages(p => [...p, msg]);
                        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
                      }
                    } else {
                      Alert.alert(item.label, "Bu özellik yakında eklenecek.");
                    }
                  }}
                >
                  <View style={[styles.attachIconWrap, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={26} color="#fff" />
                  </View>
                  <Text style={[styles.attachLabel, { color: c.text }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Emoji Picker */}
      <EmojiPicker
        visible={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        onPick={handlePickEmoji}
        colors={c}
      />

      {/* Gift Sheet */}
      <GiftSheet
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        onSend={handleSendGift}
        recipientName={user.name}
        recipientPhoto={user.photo}
        colors={c}
      />

      {/* Gift Animation Overlay */}
      {activeGiftAnim && (
        <GiftAnimation
          gift={activeGiftAnim}
          onDone={() => setActiveGiftAnim(null)}
        />
      )}
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

      {msg.gift ? (
        <View style={[styles.giftBubble, { backgroundColor: msg.gift.color + "22", borderColor: msg.gift.color }]}>
          <Text style={styles.giftBubbleEmoji}>{msg.gift.emoji}</Text>
          <Text style={[styles.giftBubbleName, { color: c.text }]}>{msg.gift.name}</Text>
          <View style={styles.giftBubblePrice}>
            <Ionicons name="logo-bitcoin" size={11} color="#F59E0B" />
            <Text style={[styles.giftBubblePriceText, { color: c.textMuted }]}>{msg.gift.price}</Text>
          </View>
          <Text style={[styles.giftBubbleTag, { color: msg.gift.color }]}>
            {fromMe ? "Hediye gönderdin" : "Sana hediye gönderdi"}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.bubbleTime, { color: c.textMuted }]}>{msg.time}</Text>
            {fromMe && msg.status && (
              <Ionicons
                name={msg.status === "read" ? "checkmark-done" : "checkmark"}
                size={14}
                color={msg.status === "read" ? "#7DD3FC" : c.textMuted}
              />
            )}
          </View>
        </View>
      ) : (
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
      )}
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

  attachWrap: { flex: 1, justifyContent: "flex-end" },
  attachSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  attachHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  attachTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
  },
  attachGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  attachItem: {
    width: "30%",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  attachIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  attachLabel: { fontSize: 12, fontWeight: "500" },

  // Gift bubble
  giftBubble: {
    maxWidth: "78%",
    padding: 14,
    paddingTop: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    marginHorizontal: 4,
    gap: 4,
  },
  giftBubbleEmoji: { fontSize: 56 },
  giftBubbleName: { fontSize: 15, fontWeight: "800", marginTop: 4 },
  giftBubblePrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245,158,11,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 2,
  },
  giftBubblePriceText: { fontSize: 12, fontWeight: "600" },
  giftBubbleTag: { fontSize: 11.5, fontWeight: "700", marginTop: 4 },
});
