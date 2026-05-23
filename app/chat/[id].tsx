import { useState, useRef, useEffect, useCallback, memo } from "react";
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
  BackHandler,
  Share,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  SlideOutUp,
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCoins, TOKENS_PER_MESSAGE } from "@/context/CoinsContext";
import { usePremium } from "@/context/PremiumContext";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { api } from "@/config/api";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useChats, setActiveChat } from "@/hooks/useChats";
import type { UserProfile } from "@/context/AuthContext";
import { getSharedPosts, clearSharedPosts } from "@/constants/sharedPostsStore";
import { Gift } from "@/constants/gifts";
import { GiftSheet } from "@/components/chat/GiftSheet";
import { GiftAnimation } from "@/components/chat/GiftAnimation";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { VipName } from "@/components/common/VipName";
import * as Clipboard from "expo-clipboard";

function formatLastSeen(lastActive?: number | string | null): string {
  if (!lastActive) return "çevrimdışı";
  const d = typeof lastActive === "number" ? new Date(lastActive) : new Date(lastActive);
  if (isNaN(d.getTime())) return "çevrimdışı";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce görüldü";
  if (mins < 60) return `${mins} dk önce görüldü`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce görüldü`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "dün görüldü";
  if (days < 7) return `${days} gün önce görüldü`;
  return `son görülme ${d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`;
}

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
  const { messages, loading: chatLoading, sendText, sendGift, sendImage, sendSharedPost, reactToMessage, myUid, formatTime } = useChat(id);
  const { markRead } = useChats();
  const router = useRouter();
  const userPhoto = user?.photoURL || user?.photos?.[0] || null;
  const { theme, mode } = useTheme();
  const { balance: tokenBalance, spend: spendTokens } = useCoins();
  const { isPremium } = usePremium();
  const { profile } = useAuth();
  const myVip = profile?.vip ?? isPremium;
  const otherVip = user?.vip ?? false;
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [text, setText] = useState(draft ? decodeURIComponent(draft as string) : "");
  const textRef = useRef(text); // senkron text takibi — hizli yazimda state gecikmesini onler
  const setTextSync = useCallback((val: string) => {
    textRef.current = val;
    setText(val);
  }, []);
  const [attachOpen, setAttachOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"emoji" | "gift" | "vip" | null>(null);
  const [activeGiftAnim, setActiveGiftAnim] = useState<Gift | null>(null);
  const [giftAnimKey, setGiftAnimKey] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const panelOpen = panelTab !== null;
  const sharedPostsSent = useRef(false);

  // WhatsApp tarzı mesaj secimi
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [localDeletedIds, setLocalDeletedIds] = useState<Set<string>>(new Set());
  const [deletedForAllIds, setDeletedForAllIds] = useState<Set<string>>(new Set());
  const isMsgSelecting = selectedMsgIds.size > 0;

  // Emoji reaction bar — tek seferde yalnizca bir mesajda acik
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Filtrelenmis mesajlar — silinen mesajlari gizle veya "silindi" olarak goster
  const displayMessages = messages.filter((m) => !localDeletedIds.has(m.id));
  // inverted FlatList icin ters sira
  const invertedMessages = [...displayMessages].reverse();

  const toggleMsgSelect = useCallback((msgId: string) => {
    setSelectedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

  // Ref'ler — callback'lerin bagimliligini azalt, gereksiz re-render onle
  const isMsgSelectingRef = useRef(isMsgSelecting);
  isMsgSelectingRef.current = isMsgSelecting;
  const activeReactionMsgIdRef = useRef(activeReactionMsgId);
  activeReactionMsgIdRef.current = activeReactionMsgId;

  const handleMsgPress = useCallback((msgId: string) => {
    if (isMsgSelectingRef.current) toggleMsgSelect(msgId);
  }, [toggleMsgSelect]);

  const handleMsgLongPress = useCallback((msgId: string) => {
    if (!isMsgSelectingRef.current) setSelectedMsgIds(new Set([msgId]));
  }, []);

  const handleToggleReaction = useCallback((msgId: string) => {
    setActiveReactionMsgId((prev) => prev === msgId ? null : msgId);
  }, []);

  const handleReact = useCallback((msgId: string, emoji: string) => {
    reactToMessage(msgId, emoji);
  }, [reactToMessage]);

  // Back handler
  useEffect(() => {
    if (!isMsgSelecting) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedMsgIds(new Set());
      return true;
    });
    return () => handler.remove();
  }, [isMsgSelecting]);

  function handleCopySelected() {
    const selected = messages.filter((m) => selectedMsgIds.has(m.id));
    const textToCopy = selected.map((m) => m.text).filter(Boolean).join("\n");
    if (textToCopy) {
      Clipboard.setStringAsync(textToCopy);
    }
    setSelectedMsgIds(new Set());
  }

  async function handleShareSelected() {
    const selected = messages.filter((m) => selectedMsgIds.has(m.id));
    const textToShare = selected.map((m) => m.text).filter(Boolean).join("\n");
    if (textToShare) {
      await Share.share({ message: textToShare });
    }
    setSelectedMsgIds(new Set());
  }

  function handleDeleteSelected() {
    const ids = [...selectedMsgIds];
    Alert.alert(
      "Mesajları Sil",
      `${ids.length} mesajı nasıl silmek istiyorsun?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Benden Sil",
          onPress: () => {
            // Sadece local'den kaldir
            deleteMessagesLocal(ids);
            setSelectedMsgIds(new Set());
          },
        },
        {
          text: "Herkesten Sil",
          style: "destructive",
          onPress: () => {
            deleteMessagesForAll(ids);
            setSelectedMsgIds(new Set());
          },
        },
      ]
    );
  }

  function deleteMessagesLocal(msgIds: string[]) {
    const set = new Set(msgIds);
    // Client tarafinda sakla — API'ye gonder ki bir daha gostermesin
    api.post(`/api/chats/${id}/delete-messages`, { messageIds: msgIds, mode: "me" }).catch(() => {});
    // Local state'ten cikar (gorunmez yap — useChat'te filtreleme yapacagiz)
    // Simdilik sadece local kaldir
    setLocalDeletedIds((prev) => new Set([...prev, ...msgIds]));
  }

  function deleteMessagesForAll(msgIds: string[]) {
    api.post(`/api/chats/${id}/delete-messages`, { messageIds: msgIds, mode: "all" }).catch(() => {});
    // Mesajlari "silindi" olarak isaretle
    setDeletedForAllIds((prev) => new Set([...prev, ...msgIds]));
  }

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
          userId: sp.userId,
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

  function switchTab(t: "emoji" | "gift" | "vip") {
    setPanelTab(t);
  }

  function handleInputFocus() {
    if (panelOpen) setPanelTab(null);
  }

  // Mark chat as read + active chat tracking
  useEffect(() => {
    if (id) {
      markRead(id);
      setActiveChat(id);
    }
    return () => { setActiveChat(null); };
  }, [id]);

  // inverted FlatList kullaniyoruz — en altta basliyor, scroll yok
  // Yeni mesaj gelince zaten en uste (inverted = en alta) ekleniyor

  // Play gift animation for receiver on first view
  const giftAnimPlayed = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!myUid || messages.length === 0) return;
    (async () => {
      const key = `seen_gifts_${myUid}`;
      const raw = await AsyncStorage.getItem(key);
      const seen: string[] = raw ? JSON.parse(raw) : [];
      const seenSet = new Set(seen);

      for (const m of messages) {
        if (m.type === "gift" && m.gift && m.senderId !== myUid && !seenSet.has(m.id) && !giftAnimPlayed.current.has(m.id)) {
          giftAnimPlayed.current.add(m.id);
          seenSet.add(m.id);
          setGiftAnimKey((k) => k + 1);
          setActiveGiftAnim(m.gift!);
          break;
        }
      }

      await AsyncStorage.setItem(key, JSON.stringify([...seenSet]));
    })();
  }, [messages, myUid]);

  async function handleSendGift(g: Gift) {
    setGiftAnimKey((k) => k + 1);
    setActiveGiftAnim(g);
    await sendGift(g);
  }

  function handlePickEmoji(emoji: string) {
    setTextSync(textRef.current + emoji);
  }

  const sendingRef = useRef(false);

  function handleSend() {
    const currentText = textRef.current.trim();
    if (!currentText || !user || sendingRef.current) return;
    sendingRef.current = true;

    if (tokenBalance < TOKENS_PER_MESSAGE) {
      sendingRef.current = false;
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

    // Hemen mesaji gonder, token harcamayi arka planda yap
    setTextSync("");
    sendText(currentText);
    spendTokens(TOKENS_PER_MESSAGE).catch(() => {});

    // 150ms debounce — hizli ama cift tiklamayi onler
    setTimeout(() => { sendingRef.current = false; }, 150);
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

      {/* Header / Selection Bar */}
      {isMsgSelecting ? (
        <Animated.View
          entering={SlideInUp.duration(200)}
          exiting={SlideOutUp.duration(200)}
          style={[styles.header, { borderBottomColor: c.border, backgroundColor: c.primary }]}
        >
          <Pressable onPress={() => setSelectedMsgIds(new Set())} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", flex: 1 }}>{selectedMsgIds.size}</Text>
          <Pressable hitSlop={8} style={styles.headerBtn} onPress={handleCopySelected}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable hitSlop={8} style={styles.headerBtn} onPress={handleShareSelected}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable hitSlop={8} style={styles.headerBtn} onPress={handleDeleteSelected}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      ) : (
        <View style={[styles.header, { borderBottomColor: c.border, backgroundColor: c.card }]}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={c.text} />
          </Pressable>

          <Pressable
            style={styles.userBlock}
            onPress={() => router.push(`/user/${user.uid}`)}
          >
            <View style={styles.headerAvatarWrap}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, { backgroundColor: c.surface }]} />
              )}
              {user.online && <View style={[styles.dot, { backgroundColor: c.online, borderColor: c.card }]} />}
            </View>
            <View style={{ flex: 1 }}>
              <VipName name={user.name} vip={user.vip} style={{ color: c.text }} fontSize={15} />
              <Text style={[styles.headerStatus, { color: user.online ? c.online : c.textMuted }]}>
                {user.online ? "çevrimiçi" : formatLastSeen(user.lastActive)}
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
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={invertedMessages}
          keyExtractor={(it) => it.id}
          inverted
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.matchedCard}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.matchedAvatar} />
              ) : (
                <View style={[styles.matchedAvatar, { backgroundColor: c.surface }]} />
              )}
              <Text style={[styles.matchedText, { color: c.text }]}>
                <Text style={{ fontWeight: "700" }}>{user.name} </Text>
                ile eşleştiniz
              </Text>
              <Text style={[styles.matchedSub, { color: c.textMuted }]}>
                Selam de, sohbet başlasın
              </Text>
            </View>
          }
          ListEmptyComponent={
            chatLoading ? (
              <View style={styles.loadingWrap}>
                <Text style={[styles.loadingText, { color: c.textMuted }]}>Mesajlar yükleniyor…</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            // inverted listede index 0 = en son mesaj
            // prev/next hesaplamasi icin orijinal sirayi kullan
            const origIdx = displayMessages.length - 1 - index;
            const prev = origIdx > 0 ? displayMessages[origIdx - 1] : undefined;
            const next = origIdx < displayMessages.length - 1 ? displayMessages[origIdx + 1] : undefined;
            const fromMe = item.senderId === myUid;
            const prevFromMe = prev ? prev.senderId === myUid : !fromMe;
            const nextFromMe = next ? next.senderId === myUid : !fromMe;
            const isFirstOfGroup = prevFromMe !== fromMe;
            const isLastOfGroup = nextFromMe !== fromMe;
            const isDeleted = item.deleted || deletedForAllIds.has(item.id);
            const displayMsg = isDeleted
              ? { ...item, text: "Bu mesaj silindi", type: "text" as const, deleted: true, gift: undefined, storyReply: undefined, sharedPost: undefined, reactions: [] }
              : item;
            return (
              <BubbleWrapper
                item={displayMsg}
                fromMe={fromMe}
                isFirstOfGroup={isFirstOfGroup}
                isLastOfGroup={isLastOfGroup}
                avatar={fromMe ? null : userPhoto}
                colors={c}
                timeStr={formatTime(item.createdAt)}
                senderVip={fromMe ? myVip : otherVip}
                selected={selectedMsgIds.has(item.id)}
                isSelecting={isMsgSelecting}
                isDeleted={isDeleted}
                onMsgPress={handleMsgPress}
                onMsgLongPress={handleMsgLongPress}
                onReact={handleReact}
                myUid={myUid}
                showReactionBar={activeReactionMsgId === item.id}
                onToggleReaction={handleToggleReaction}
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
              onChangeText={setTextSync}
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
              <Pressable onPress={() => switchTab("vip")} style={styles.panelTabBtn}>
                <Text style={{ fontSize: 16 }}>👑</Text>
                <Text style={[styles.panelTabLabel, { color: panelTab === "vip" ? "#D4AF37" : c.textMuted }]}>VIP</Text>
                {panelTab === "vip" && <View style={[styles.panelTabUnderline, { backgroundColor: "#D4AF37" }]} />}
              </Pressable>
            </View>

            <View style={styles.panelContent}>
              {panelTab === "emoji" ? (
                <EmojiPicker onPick={handlePickEmoji} colors={c} />
              ) : panelTab === "vip" ? (
                myVip ? (
                  <GiftSheet
                    onSend={(g) => { handleSendGift(g); setPanelTab(null); }}
                    recipientName={user.name}
                    recipientPhoto={userPhoto ?? ""}
                    colors={c}
                    vipOnly
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
                    <Text style={{ fontSize: 40 }}>👑</Text>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#D4AF37" }}>VIP Hediyeler</Text>
                    <Text style={{ fontSize: 13, color: c.textMuted, textAlign: "center" }}>
                      Özel VIP hediyeler göndermek için Premium üyelik gerekiyor.
                    </Text>
                    <Pressable
                      onPress={() => { setPanelTab(null); router.push("/premium"); }}
                      style={{ backgroundColor: "#D4AF37", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 4 }}
                    >
                      <Text style={{ color: "#000", fontWeight: "800", fontSize: 14 }}>Premium'a Geç</Text>
                    </Pressable>
                  </View>
                )
              ) : (
                <GiftSheet
                  onSend={(g) => { handleSendGift(g); setPanelTab(null); }}
                  recipientName={user.name}
                  recipientPhoto={userPhoto ?? ""}
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

const BubbleWrapper = memo(function BubbleWrapper({
  item,
  fromMe,
  isFirstOfGroup,
  isLastOfGroup,
  avatar,
  colors,
  timeStr,
  senderVip,
  selected,
  isSelecting,
  isDeleted,
  onMsgPress,
  onMsgLongPress,
  onReact,
  myUid,
  showReactionBar,
  onToggleReaction,
}: {
  item: ChatMessage;
  fromMe: boolean;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  avatar: string | null;
  colors: any;
  timeStr: string;
  senderVip: boolean;
  selected: boolean;
  isSelecting: boolean;
  isDeleted: boolean;
  onMsgPress: (id: string) => void;
  onMsgLongPress: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  myUid: string;
  showReactionBar: boolean;
  onToggleReaction: (id: string) => void;
}) {
  const handlePress = useCallback(() => onMsgPress(item.id), [item.id, onMsgPress]);
  const handleLongPress = useCallback(() => onMsgLongPress(item.id), [item.id, onMsgLongPress]);
  const handleReact = useCallback((emoji: string) => onReact(item.id, emoji), [item.id, onReact]);
  const handleToggle = useCallback(() => onToggleReaction(item.id), [item.id, onToggleReaction]);

  return (
    <Bubble
      msg={item}
      fromMe={fromMe}
      isFirstOfGroup={isFirstOfGroup}
      isLastOfGroup={isLastOfGroup}
      avatar={avatar}
      colors={colors}
      timeStr={timeStr}
      senderVip={senderVip}
      selected={selected}
      isSelecting={isSelecting}
      isDeleted={isDeleted}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onReact={handleReact}
      myUid={myUid}
      showReactionBar={showReactionBar}
      onToggleReactionBar={handleToggle}
    />
  );
});

const Bubble = memo(function Bubble({
  msg,
  fromMe,
  isFirstOfGroup,
  isLastOfGroup,
  avatar,
  colors: c,
  timeStr,
  senderVip = false,
  selected = false,
  isSelecting = false,
  isDeleted = false,
  onPress,
  onLongPress,
  onReact,
  myUid,
  showReactionBar = false,
  onToggleReactionBar,
}: {
  msg: ChatMessage;
  fromMe: boolean;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  avatar: string | null;
  colors: any;
  timeStr: string;
  senderVip?: boolean;
  selected?: boolean;
  isSelecting?: boolean;
  isDeleted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onReact?: (emoji: string) => void;
  myUid?: string;
  showReactionBar?: boolean;
  onToggleReactionBar?: () => void;
}) {
  const router = useRouter();
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

  const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const reactions = msg.reactions ?? [];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={150}
      style={{ backgroundColor: selected ? `${c.primary}15` : "transparent", borderRadius: 4 }}
    >
    {/* Emoji reaction bar — mesajin ustunde */}
    {showReactionBar && !isDeleted && (
      <Animated.View
        entering={FadeIn.duration(120)}
        style={[
          styles.reactionBar,
          fromMe ? { alignSelf: "flex-end", marginRight: 36 } : { alignSelf: "flex-start", marginLeft: 36 },
        ]}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => {
              onReact?.(emoji);
              onToggleReactionBar?.(); // kapat
            }}
            style={styles.reactionBarItem}
          >
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </Pressable>
        ))}
      </Animated.View>
    )}
    <View
      style={[
        styles.bubbleRow,
        fromMe ? styles.bubbleRowMe : styles.bubbleRowOther,
        { marginTop: isFirstOfGroup ? 8 : 2, marginBottom: (isLastOfGroup || reactions.length > 0) ? 4 : 1 },
      ]}
    >
      {!fromMe && (
        <View style={styles.bubbleAvatarSlot}>
          {isLastOfGroup && avatar ? (
            <Image source={{ uri: avatar }} style={styles.bubbleAvatar} />
          ) : null}
        </View>
      )}

      {/* Emoji trigger icon — fromMe ise solda */}
      {fromMe && !isDeleted && !isSelecting && (
        <Pressable
          onPress={onToggleReactionBar}
          hitSlop={6}
          style={styles.emojiTrigger}
        >
          <Ionicons name="happy-outline" size={16} color={c.textMuted} style={{ opacity: 0.5 }} />
        </Pressable>
      )}

      {msg.storyReply ? (
        <Pressable
          onPress={() => router.push(`/story/${msg.storyReply!.storyOwnerId}` as any)}
          style={[
            styles.storyReplyBubble,
            fromMe
              ? { backgroundColor: c.primary, alignSelf: "flex-end" }
              : { backgroundColor: c.surface, alignSelf: "flex-start" },
            bubbleRadius,
          ]}
        >
          {/* Story thumbnail */}
          <View style={styles.storyReplyPreview}>
            <Image
              source={{ uri: msg.storyReply!.storyImageUrl }}
              style={styles.storyReplyImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)"]}
              style={styles.storyReplyGradient}
            />
            <View style={styles.storyReplyLabel}>
              <Ionicons name="play-circle-outline" size={14} color="#fff" />
              <Text style={styles.storyReplyLabelText}>Hikaye</Text>
            </View>
          </View>
          {/* Reply text/emoji */}
          <View style={styles.storyReplyContent}>
            {msg.storyReply!.isEmoji ? (
              <Text style={{ fontSize: 28 }}>{msg.text}</Text>
            ) : (
              <Text style={[styles.bubbleText, { color: fromMe ? "#fff" : c.text }]}>{msg.text}</Text>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.bubbleTime, { color: fromMe ? "rgba(255,255,255,0.7)" : c.textMuted }]}>
                {timeStr}
              </Text>
              {fromMe && msg.status && (
                <Ionicons
                  name={msg.status === "read" ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={msg.status === "read" ? "#7DD3FC" : fromMe ? "rgba(255,255,255,0.7)" : c.textMuted}
                />
              )}
            </View>
          </View>
        </Pressable>
      ) : msg.sharedPost ? (
        <Pressable
          onPress={() => {
            router.push("/(tabs)/posts" as any);
          }}
          style={[styles.sharedPostBubble, { backgroundColor: c.surface, borderColor: c.border }]}
        >
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
          <View style={styles.sharedPostTapHint}>
            <Ionicons name="arrow-forward-circle-outline" size={13} color={c.textMuted} />
            <Text style={[styles.sharedPostTapHintText, { color: c.textMuted }]}>Gönderilere git</Text>
          </View>
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
        </Pressable>
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
      ) : senderVip ? (
        <LinearGradient
          colors={fromMe ? ["#D4AF37", "#B8860B"] : ["#D4AF37", "#F5D97A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ padding: 1.5, maxWidth: "78%", marginHorizontal: 4 }, bubbleRadius]}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: fromMe ? "rgba(30,20,5,0.92)" : "rgba(255,250,235,0.95)",
                maxWidth: "100%",
                marginHorizontal: 0,
              },
              bubbleRadius,
            ]}
          >
            {isFirstOfGroup && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 }}>
                <Text style={{ fontSize: 10, color: "#D4AF37" }}>👑</Text>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#D4AF37" }}>VIP</Text>
              </View>
            )}
            <Text style={[styles.bubbleText, { color: fromMe ? "#F5D97A" : "#5A4100" }]}>{msg.text}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.bubbleTime, { color: fromMe ? "rgba(245,217,122,0.7)" : "rgba(90,65,0,0.5)" }]}>
                {timeStr}
              </Text>
              {fromMe && msg.status && (
                <Ionicons
                  name={msg.status === "read" ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={msg.status === "read" ? "#7DD3FC" : "rgba(245,217,122,0.7)"}
                />
              )}
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.bubble,
            fromMe
              ? { backgroundColor: isDeleted ? `${c.primary}60` : c.primary, alignSelf: "flex-end" }
              : { backgroundColor: isDeleted ? `${c.surface}80` : c.surface, alignSelf: "flex-start" },
            bubbleRadius,
          ]}
        >
          <Text style={[
            styles.bubbleText,
            { color: fromMe ? "#fff" : c.text },
            isDeleted && { fontStyle: "italic", opacity: 0.7 },
          ]}>{msg.text}</Text>
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

      {/* Emoji trigger icon — karsi taraf mesaji ise sagda */}
      {!fromMe && !isDeleted && !isSelecting && (
        <Pressable
          onPress={onToggleReactionBar}
          hitSlop={6}
          style={styles.emojiTrigger}
        >
          <Ionicons name="happy-outline" size={16} color={c.textMuted} style={{ opacity: 0.5 }} />
        </Pressable>
      )}
    </View>
    {/* Reactions display — bubble altinda */}
    {reactions.length > 0 && (
      <View style={[
        styles.reactionsRow,
        fromMe ? { alignSelf: "flex-end", marginRight: 8 } : { alignSelf: "flex-start", marginLeft: 36 },
      ]}>
        {(() => {
          // Emoji'leri grupla
          const grouped = new Map<string, number>();
          reactions.forEach((r) => grouped.set(r.emoji, (grouped.get(r.emoji) ?? 0) + 1));
          return [...grouped.entries()].map(([emoji, count]) => (
            <Pressable
              key={emoji}
              onPress={() => onReact?.(emoji)}
              style={[
                styles.reactionChip,
                { backgroundColor: c.surface, borderColor: reactions.some(r => r.userId === myUid && r.emoji === emoji) ? c.primary : c.border },
              ]}
            >
              <Text style={{ fontSize: 13 }}>{emoji}</Text>
              {count > 1 && <Text style={[styles.reactionCount, { color: c.textMuted }]}>{count}</Text>}
            </Pressable>
          ));
        })()}
      </View>
    )}
    </Pressable>
  );
});

function PanelToggleIcon({
  panelOpen,
  tab,
  mutedColor,
  primaryColor,
}: {
  panelOpen: boolean;
  tab: "emoji" | "gift" | "vip" | null;
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

  // Story reply bubble
  storyReplyBubble: {
    width: 200,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  storyReplyPreview: {
    width: 200,
    height: 180,
    position: "relative",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  storyReplyImage: {
    width: "100%",
    height: "100%",
  },
  storyReplyGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
  },
  storyReplyLabel: {
    position: "absolute",
    bottom: 6,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storyReplyLabelText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  storyReplyContent: {
    padding: 10,
  },

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
  sharedPostTapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  sharedPostTapHintText: { fontSize: 11 },

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

  // Emoji trigger icon
  emojiTrigger: {
    padding: 4,
    alignSelf: "center",
    marginHorizontal: 2,
  },

  // Emoji reactions
  reactionBar: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 4,
    gap: 2,
  },
  reactionBarItem: {
    padding: 4,
    paddingHorizontal: 6,
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: -2,
    marginBottom: 2,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "600",
  },
});
