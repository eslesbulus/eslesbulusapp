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
  withSpring,
  Easing,
  SharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useCoins, TOKENS_PER_MESSAGE } from "@/context/CoinsContext";
import { useUser } from "@/hooks/useUser";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import type { UserProfile } from "@/context/AuthContext";
import { getSharedPosts, clearSharedPosts } from "@/constants/sharedPostsStore";
import { Gift } from "@/constants/gifts";
import { GiftSheet } from "@/components/chat/GiftSheet";
import { GiftAnimation } from "@/components/chat/GiftAnimation";
import { EmojiPicker } from "@/components/chat/EmojiPicker";

function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace("#", "");
  const safe = m.length === 6 ? m : "888888";
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ChatDetailScreen() {
  const { id, draft } = useLocalSearchParams<{ id: string; draft?: string }>();
  const { user, loading: userLoading } = useUser(id);
  const { messages, loading: chatLoading, sendText, sendGift, sendImage, sendSharedPost, myUid, formatTime } = useChat(id);
  const router = useRouter();
  const userPhoto = user?.photoURL || user?.photos?.[0] || "";
  const { theme, mode } = useTheme();
  const { balance: tokenBalance, spend: spendTokens } = useCoins();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [text, setText] = useState(draft ? decodeURIComponent(draft as string) : "");
  const [attachOpen, setAttachOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"emoji" | "gift" | null>(null);
  const [activeGiftAnim, setActiveGiftAnim] = useState<Gift | null>(null);
  const [giftAnimKey, setGiftAnimKey] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const panelOpen = panelTab !== null;
  const sharedPostsSent = useRef(false);

  // Send shared posts on first load (from post sharing flow)
  useEffect(() => {
    if (sharedPostsSent.current || !user || chatLoading) return;
    sharedPostsSent.current = true;
    const shared = getSharedPosts(user.uid);
    if (shared.length > 0) {
      clearSharedPosts(user.uid);
      shared.forEach((sp) => {
        sendSharedPost({
          id: sp.postId,
          userName: sp.userName,
          userPhoto: sp.userPhoto,
          text: sp.text,
          image: sp.image,
        });
      });
    }
  }, [user, chatLoading]);

  function togglePanel() {
    if (panelOpen) {
      setPanelTab(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      Keyboard.dismiss();
      setPanelTab("emoji");
    }
  }

  function switchTab(t: "emoji" | "gift") {
    setPanelTab(t);
  }

  function handleInputFocus() {
    if (panelOpen) setPanelTab(null);
  }

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSendGift(g: Gift) {
    setGiftAnimKey((k) => k + 1);
    setActiveGiftAnim(g);
    await sendGift(g);
  }

  function handlePickEmoji(emoji: string) {
    setText((t) => t + emoji);
  }

  async function handleSend() {
    if (!text.trim() || !user) return;

    // Jeton kontrolü
    if (tokenBalance < TOKENS_PER_MESSAGE) {
      Alert.alert(
        "Jeton Yetersiz 🪙",
        `Mesaj göndermek için ${TOKENS_PER_MESSAGE} jeton gerekiyor. Şu an ${tokenBalance} jetonun var.`,
        [
          { text: "İptal", style: "cancel" },
          { text: "Jeton Al →", onPress: () => router.push("/premium/coins") },
        ]
      );
      return;
    }

    const spent = await spendTokens(TOKENS_PER_MESSAGE);
    if (!spent) return;

    const msgText = text.trim();
    setText("");
    await sendText(msgText);
  }

  if (userLoading || !user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.notFound}>
          {userLoading ? (
            <Text style={[styles.notFoundText, { color: c.textMuted }]}>Yükleniyor…</Text>
          ) : (
            <Text style={[styles.notFoundText, { color: c.text }]}>Kullanıcı bulunamadı</Text>
          )}
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
          onPress={() => router.push(`/user/${user.uid}`)}
        >
          <View style={styles.headerAvatarWrap}>
            <Image source={{ uri: userPhoto }} style={styles.headerAvatar} />
            {user.online && <View style={[styles.dot, { backgroundColor: c.online, borderColor: c.card }]} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerName, { color: c.text }]}>{user.name}</Text>
            <Text style={[styles.headerStatus, { color: user.online ? c.online : c.textMuted }]}>
              {user.online ? "çevrimiçi" : "çevrimdışı"}
            </Text>
          </View>
        </Pressable>

        {/* Jeton bakiyesi */}
        <Pressable
          hitSlop={8}
          style={styles.tokenPill}
          onPress={() => router.push("/premium/coins")}
        >
          <Text style={styles.tokenPillText}>🪙 {tokenBalance}</Text>
        </Pressable>

        <Pressable hitSlop={8} style={styles.headerBtn} onPress={() => router.push(`/call/${user.uid}?type=video`)}>
          <Ionicons name="videocam-outline" size={22} color={c.text} />
        </Pressable>
        <Pressable hitSlop={8} style={styles.headerBtn} onPress={() => router.push(`/call/${user.uid}?type=voice`)}>
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
              <Image source={{ uri: userPhoto }} style={styles.matchedAvatar} />
              <Text style={[styles.matchedText, { color: c.text }]}>
                <Text style={{ fontWeight: "700" }}>{user.name} </Text>
                ile eşleştiniz
              </Text>
              <Text style={[styles.matchedSub, { color: c.textMuted }]}>
                Selam de, sohbet başlasın
              </Text>
            </Animated.View>
          }
          ListEmptyComponent={
            chatLoading ? (
              <View style={styles.loadingWrap}>
                <Text style={[styles.loadingText, { color: c.textMuted }]}>Mesajlar yükleniyor…</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const prev = messages[index - 1];
            const next = messages[index + 1];
            const fromMe = item.senderId === myUid;
            const prevFromMe = prev ? prev.senderId === myUid : !fromMe;
            const nextFromMe = next ? next.senderId === myUid : !fromMe;
            const isFirstOfGroup = prevFromMe !== fromMe;
            const isLastOfGroup = nextFromMe !== fromMe;
            return (
              <Bubble
                msg={item}
                fromMe={fromMe}
                isFirstOfGroup={isFirstOfGroup}
                isLastOfGroup={isLastOfGroup}
                avatar={fromMe ? null : userPhoto}
                colors={c}
                timeStr={formatTime(item.createdAt)}
              />
            );
          }}
        />

        {/* Input */}
        <View style={[styles.inputBar, { borderTopColor: c.border, backgroundColor: c.card, paddingBottom: panelOpen ? 8 : Math.max(insets.bottom - 6, 8) }]}>
          <Pressable hitSlop={6} style={styles.iconBtn} onPress={() => { Keyboard.dismiss(); setPanelTab(null); setAttachOpen(true); }}>
            <Ionicons name="add-circle" size={28} color={c.primary} />
          </Pressable>
          <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Pressable hitSlop={6} style={styles.emojiInsideBtn} onPress={togglePanel}>
              <PanelToggleIcon panelOpen={panelOpen} tab={panelTab} mutedColor={c.textMuted} primaryColor={c.primary} />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: c.text }]}
              placeholder="Mesaj"
              placeholderTextColor={c.textMuted}
              value={text}
              onChangeText={setText}
              onFocus={handleInputFocus}
              multiline
              maxLength={500}
            />
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

        {/* Inline Emoji/Gift Panel */}
        {panelOpen && (
          <Animated.View
            entering={FadeIn.duration(160)}
            style={[styles.panel, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: 0 }]}
          >
            <View style={[styles.panelTabs, { borderBottomColor: c.border }]}>
              <Pressable onPress={() => switchTab("emoji")} style={styles.panelTabBtn}>
                <Ionicons name="happy-outline" size={20} color={panelTab === "emoji" ? c.primary : c.textMuted} />
                <Text style={[styles.panelTabLabel, { color: panelTab === "emoji" ? c.primary : c.textMuted }]}>Emoji</Text>
                {panelTab === "emoji" && <View style={[styles.panelTabUnderline, { backgroundColor: c.primary }]} />}
              </Pressable>
              <Pressable onPress={() => switchTab("gift")} style={styles.panelTabBtn}>
                <Ionicons name="gift-outline" size={20} color={panelTab === "gift" ? c.primary : c.textMuted} />
                <Text style={[styles.panelTabLabel, { color: panelTab === "gift" ? c.primary : c.textMuted }]}>Hediye</Text>
                {panelTab === "gift" && <View style={[styles.panelTabUnderline, { backgroundColor: c.primary }]} />}
              </Pressable>
            </View>

            <View style={styles.panelContent}>
              {panelTab === "emoji" ? (
                <EmojiPicker onPick={handlePickEmoji} colors={c} />
              ) : (
                <GiftSheet
                  onSend={(g) => { handleSendGift(g); setPanelTab(null); }}
                  recipientName={user.name}
                  recipientPhoto={userPhoto}
                  colors={c}
                />
              )}
            </View>
          </Animated.View>
        )}
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
                { icon: "camera", label: "Kamera", color: "#7C3AED" },
                { icon: "images", label: "Galeri", color: "#2563EB" },
                { icon: "videocam", label: "Video", color: "#DC2626" },
                { icon: "document-text", label: "Dosya", color: "#D97706" },
                { icon: "location", label: "Konum", color: "#16A34A" },
                { icon: "musical-notes", label: "Müzik", color: "#DB2777" },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.attachItem}
                  onPress={async () => {
                    setAttachOpen(false);
                    if (item.icon === "camera") {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== "granted") { Alert.alert("İzin Gerekli", "Kamera izni verilmedi."); return; }
                      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 });
                      if (!res.canceled) {
                        await sendImage("📷 Fotoğraf gönderildi");
                      }
                    } else if (item.icon === "images" || item.icon === "videocam") {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== "granted") { Alert.alert("İzin Gerekli", "Galeri izni verilmedi."); return; }
                      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: item.icon === "videocam" ? ["videos"] : ["images"], quality: 0.9 });
                      if (!res.canceled) {
                        const label = item.icon === "videocam" ? "🎥 Video gönderildi" : "🖼 Fotoğraf gönderildi";
                        await sendImage(label);
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

      {/* Gift Animation Overlay */}
      {activeGiftAnim && (
        <GiftAnimation
          key={giftAnimKey}
          gift={activeGiftAnim}
          onDone={() => setActiveGiftAnim(null)}
        />
      )}
    </SafeAreaView>
  );
}

function Bubble({
  msg,
  fromMe,
  isFirstOfGroup,
  isLastOfGroup,
  avatar,
  colors: c,
  timeStr,
}: {
  msg: ChatMessage;
  fromMe: boolean;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  avatar: string | null;
  colors: any;
  timeStr: string;
}) {
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

      {msg.sharedPost ? (
        <View style={[styles.sharedPostBubble, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.sharedPostHeader}>
            <Image source={{ uri: msg.sharedPost.userPhoto }} style={styles.sharedPostAvatar} />
            <Text style={[styles.sharedPostUser, { color: c.text }]} numberOfLines={1}>
              {msg.sharedPost.userName}
            </Text>
            <Ionicons name="paper-plane-outline" size={13} color={c.textMuted} />
          </View>
          {msg.sharedPost.image ? (
            <Image
              source={{ uri: msg.sharedPost.image }}
              style={styles.sharedPostImage}
              resizeMode="cover"
            />
          ) : null}
          {msg.sharedPost.text ? (
            <Text style={[styles.sharedPostText, { color: c.text }]} numberOfLines={3}>
              {msg.sharedPost.text}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={[styles.bubbleTime, { color: c.textMuted }]}>{timeStr}</Text>
            {fromMe && msg.status && (
              <Ionicons
                name={msg.status === "read" ? "checkmark-done" : "checkmark"}
                size={14}
                color={msg.status === "read" ? "#7DD3FC" : c.textMuted}
              />
            )}
          </View>
        </View>
      ) : msg.gift ? (
        <View style={[styles.giftBubble, { backgroundColor: hexToRgba(msg.gift.color, 0.13), borderColor: msg.gift.color }]}>
          <Text style={styles.giftBubbleEmoji}>{msg.gift.emoji}</Text>
          <Text style={[styles.giftBubbleName, { color: c.text }]}>{msg.gift.name}</Text>
          <View style={styles.giftBubblePrice}>
            <Text style={{ fontSize: 12 }}>🪙</Text>
            <Text style={[styles.giftBubblePriceText, { color: c.textMuted }]}>{msg.gift.price}</Text>
          </View>
          <Text style={[styles.giftBubbleTag, { color: msg.gift.color }]}>
            {fromMe ? "Hediye gönderdin" : "Sana hediye gönderdi"}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.bubbleTime, { color: c.textMuted }]}>{timeStr}</Text>
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
              {timeStr}
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

function PanelToggleIcon({
  panelOpen,
  tab,
  mutedColor,
  primaryColor,
}: {
  panelOpen: boolean;
  tab: "emoji" | "gift" | null;
  mutedColor: string;
  primaryColor: string;
}) {
  const [cycle, setCycle] = useState<"emoji" | "gift">("emoji");
  const popScale = useSharedValue(1);
  const popRot = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (panelOpen) return;
    const interval = setInterval(() => {
      popScale.value = withSequence(
        withTiming(0.6, { duration: 120, easing: Easing.in(Easing.quad) }),
        withSpring(1.35, { damping: 6, stiffness: 220 }),
        withSpring(1, { damping: 10, stiffness: 180 })
      );
      popRot.value = withSequence(
        withTiming(-25, { duration: 140 }),
        withTiming(20, { duration: 140 }),
        withTiming(0, { duration: 180 })
      );
      burst.value = withSequence(
        withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 280 })
      );
      setTimeout(() => {
        setCycle((c) => (c === "emoji" ? "gift" : "emoji"));
      }, 120);
    }, 2400);
    return () => clearInterval(interval);
  }, [panelOpen]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popScale.value }, { rotate: `${popRot.value}deg` }],
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.value,
    transform: [{ scale: 0.5 + burst.value * 0.9 }],
  }));

  if (panelOpen) {
    return (
      <Animated.View key={tab} entering={FadeIn.duration(180)}>
        <Ionicons
          name={tab === "gift" ? "gift" : "happy"}
          size={22}
          color={primaryColor}
        />
      </Animated.View>
    );
  }

  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <Animated.View pointerEvents="none" style={[burstStyle, { position: "absolute" }]}>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: primaryColor }} />
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: primaryColor }} />
        </View>
      </Animated.View>
      <Animated.View style={iconStyle}>
        <Ionicons
          name={cycle === "gift" ? "gift" : "happy"}
          size={22}
          color={cycle === "gift" ? primaryColor : mutedColor}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16 },
  loadingWrap: { alignItems: "center", paddingVertical: 20 },
  loadingText: { fontSize: 13 },

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
  tokenPill: {
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 2,
  },
  tokenPillText: { fontSize: 12, fontWeight: "700", color: "#F59E0B" },

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
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 4,
    minHeight: 40,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 7 },
  emojiInsideBtn: { padding: 6, paddingLeft: 8 },

  panel: {
    minHeight: 320,
    maxHeight: 380,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  panelTabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  panelTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 12,
    position: "relative",
  },
  panelTabLabel: { fontSize: 13.5, fontWeight: "600" },
  panelTabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 24,
    right: 24,
    height: 2,
    borderRadius: 1,
  },
  panelContent: { flex: 1 },
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

  // Shared post bubble
  sharedPostBubble: {
    maxWidth: "78%",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  sharedPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sharedPostAvatar: { width: 28, height: 28, borderRadius: 14 },
  sharedPostUser: { flex: 1, fontSize: 13, fontWeight: "700" },
  sharedPostImage: { width: "100%", height: 180 },
  sharedPostText: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

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
