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
  ActivityIndicator,
} from "react-native";
import { showAlert } from "@/components/common/CustomAlert";
import * as ImagePicker from "expo-image-picker";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCoins, TOKENS_PER_MESSAGE } from "@/context/CoinsContext";
import { usePremium } from "@/context/PremiumContext";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useAppConfig } from "@/hooks/useAppConfig";
import { api } from "@/config/api";
import { useChat, type ChatMessage, type ReplyToData } from "@/hooks/useChat";
import { useChats, setActiveChat } from "@/hooks/useChats";
import type { UserProfile } from "@/context/AuthContext";
import { getSharedPosts, clearSharedPosts } from "@/constants/sharedPostsStore";
import { Gift } from "@/constants/gifts";
import { GiftSheet } from "@/components/chat/GiftSheet";
import { GiftAnimation } from "@/components/chat/GiftAnimation";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { VoiceMessageBubble } from "@/components/chat/VoiceMessageBubble";
import { VipName } from "@/components/common/VipName";
import * as Clipboard from "expo-clipboard";
import { setAudioModeAsync } from "expo-audio";
import type { TranslationKeys } from "@/i18n/tr";

function formatLastSeen(
  lastActive: number | string | null | undefined,
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string,
  lang: string
): string {
  if (!lastActive) return t("discover_offline");
  const d = typeof lastActive === "number" ? new Date(lastActive) : new Date(lastActive);
  if (isNaN(d.getTime())) return t("discover_offline");
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("time_now");
  if (mins < 60) return `${mins} ${t("time_min")}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t("time_hour")}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return t("time_yesterday");
  if (days < 7) return `${days} ${t("time_days")}`;
  const locale = lang === "tr" ? "tr-TR" : "en-US";
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function sameDay(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

function dateSeparatorLabel(
  d: Date,
  t: (key: TranslationKeys) => string,
  lang: string
): string {
  const now = new Date();
  const locale = lang === "tr" ? "tr-TR" : "en-US";
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return t("time_today");
  if (diffDays === 1) return t("time_yesterday");
  if (diffDays < 7) {
    const wd = d.toLocaleDateString(locale, { weekday: "long" });
    return wd.charAt(0).toLocaleUpperCase(locale) + wd.slice(1);
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(
    locale,
    sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" }
  );
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
  const { t, lang } = useLanguage();
  const { user, loading: userLoading } = useUser(id);
  const { messages, loading: chatLoading, loadMore, hasMore, sendText, sendGift, sendImage, sendVoice, sendSharedPost, reactToMessage, emitTyping, isOtherTyping, myUid, formatTime } = useChat(id);
  const { markRead } = useChats();
  const router = useRouter();
  const userPhoto = user?.photoURL || user?.photos?.[0] || null;
  const { theme, mode } = useTheme();
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const { balance: tokenBalance, spend: spendTokens } = useCoins();
  const { isPremium } = usePremium();
  const { callsEnabled } = useAppConfig();
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
    if (val.length > 0) emitTyping();
  }, [emitTyping]);
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

  // Satirlari olustur: gun ayraclari + gruplama bilgisi (inverted liste icin ters)
  type Row =
    | { type: "sep"; id: string; label: string }
    | { type: "msg"; id: string; msg: ChatMessage; isFirstOfGroup: boolean; isLastOfGroup: boolean };
  const rows: Row[] = [];
  let lastDayKey = "";
  for (let i = 0; i < displayMessages.length; i++) {
    const m = displayMessages[i];
    const d = m.createdAt ? new Date(m.createdAt) : new Date();
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (dayKey !== lastDayKey) {
      rows.push({ type: "sep", id: `sep_${dayKey}`, label: dateSeparatorLabel(d, t, lang) });
      lastDayKey = dayKey;
    }
    const prev = displayMessages[i - 1];
    const next = displayMessages[i + 1];
    const fromMe = m.senderId === myUid;
    const prevSameDay = prev ? sameDay(prev.createdAt, m.createdAt) : false;
    const nextSameDay = next ? sameDay(next.createdAt, m.createdAt) : false;
    const prevFromMe = prev ? prev.senderId === myUid : !fromMe;
    const nextFromMe = next ? next.senderId === myUid : !fromMe;
    const isFirstOfGroup = !prevSameDay || prevFromMe !== fromMe;
    const isLastOfGroup = !nextSameDay || nextFromMe !== fromMe;
    rows.push({ type: "msg", id: m.id, msg: m, isFirstOfGroup, isLastOfGroup });
  }
  const invertedRows = [...rows].reverse();

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

  // Swipe-to-reply handler
  const handleSwipeReply = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  }, []);

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
    showAlert(
      t("chat_delete_title"),
      t("chat_delete_confirm"),
      [
        { text: t("common_cancel"), style: "cancel" },
        {
          text: t("chat_delete_for_me"),
          onPress: () => {
            // Sadece local'den kaldir
            deleteMessagesLocal(ids);
            setSelectedMsgIds(new Set());
          },
        },
        {
          text: t("chat_delete_for_all"),
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

  // Sesli mesajlar sessiz modda da çalsın
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

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
      showAlert(
        t("coins_insufficient"),
        t("coins_insufficient_desc", { price: TOKENS_PER_MESSAGE, balance: tokenBalance }),
        [
          { text: t("common_cancel"), style: "cancel" },
          { text: t("coins_buy"), onPress: () => router.push("/premium/coins") },
        ]
      );
      return;
    }

    // Hemen mesaji gonder, token harcamayi arka planda yap
    const reply = replyingTo ? {
      messageId: replyingTo.id,
      senderId: replyingTo.senderId,
      text: replyingTo.text || (replyingTo.type === "image" ? `📷 ${t("chat_photo")}` : replyingTo.type === "video" ? `🎥 ${t("chat_video")}` : ""),
      type: replyingTo.type,
    } as ReplyToData : null;
    setTextSync("");
    setReplyingTo(null);
    sendText(currentText, reply);
    spendTokens(TOKENS_PER_MESSAGE).catch(() => {});

    // 150ms debounce — hizli ama cift tiklamayi onler
    setTimeout(() => { sendingRef.current = false; }, 150);
  }

  // Kullanıcı henüz yüklenmediyse: iskelet başlık + hayalet mesajlar göster.
  // userLoading bittikten sonra hâlâ user yoksa "bulunamadı" göster — ama en az 1.5sn bekle
  // (hızlı ağda skeleton flaş yapmasın diye)
  const [showNotFound, setShowNotFound] = useState(false);
  useEffect(() => {
    if (!userLoading && !user) {
      const t = setTimeout(() => setShowNotFound(true), 1500);
      return () => clearTimeout(t);
    }
    setShowNotFound(false);
  }, [userLoading, user]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        {!showNotFound ? (
          <>
            <View style={[styles.header, { borderBottomColor: c.border, backgroundColor: c.card }]}>
              <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={26} color={c.text} />
              </Pressable>
              <View style={[styles.headerAvatar, { backgroundColor: c.surface }]} />
              <View style={{ flex: 1, gap: 6, marginLeft: 10 }}>
                <View style={{ width: 120, height: 12, borderRadius: 6, backgroundColor: c.surface }} />
                <View style={{ width: 70, height: 9, borderRadius: 5, backgroundColor: c.surface }} />
              </View>
            </View>
            <ChatSkeleton colors={c} />
          </>
        ) : (
          <View style={styles.notFound}>
            <Text style={[styles.notFoundText, { color: c.text }]}>{t("user_not_found")}</Text>
            <Pressable onPress={() => router.back()} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: c.primary }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{t("user_go_back")}</Text>
            </Pressable>
          </View>
        )}
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
                {user.online ? t("chat_online") : formatLastSeen(user.lastActive, t, lang)}
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

          {callsEnabled && (
            <>
              <Pressable hitSlop={8} style={styles.headerBtn} onPress={() => router.push(`/call/${user.uid}?type=video`)}>
                <Ionicons name="videocam-outline" size={22} color={c.text} />
              </Pressable>
              <Pressable hitSlop={8} style={styles.headerBtn} onPress={() => router.push(`/call/${user.uid}?type=voice`)}>
                <Ionicons name="call-outline" size={20} color={c.text} />
              </Pressable>
            </>
          )}
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
          data={invertedRows}
          keyExtractor={(it) => it.id}
          inverted
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            hasMore ? (
              // Inverted listede footer en ustte (en eski) render olur — eski mesajlar yuklenirken spinner
              <View style={styles.loadOlderWrap}>
                <ActivityIndicator size="small" color={c.textMuted} />
              </View>
            ) : (
              <View style={styles.matchedCard}>
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={styles.matchedAvatar} />
                ) : (
                  <View style={[styles.matchedAvatar, { backgroundColor: c.surface }]} />
                )}
                <Text style={[styles.matchedText, { color: c.text }]}>
                  <Text style={{ fontWeight: "700" }}>{user.name} </Text>
                  {t("chat_match_card_text")}
                </Text>
                <Text style={[styles.matchedSub, { color: c.textMuted }]}>
                  {t("chat_match_card_text")}
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            chatLoading ? (
              <ChatSkeleton colors={c} />
            ) : null
          }
          renderItem={({ item }) => {
            if (item.type === "sep") {
              return <DateSeparator label={item.label} colors={c} />;
            }
            const msg = item.msg;
            const fromMe = msg.senderId === myUid;
            const isDeleted = msg.deleted || deletedForAllIds.has(msg.id);
            const displayMsg = isDeleted
              ? { ...msg, text: t("chat_message_deleted"), type: "text" as const, deleted: true, gift: undefined, storyReply: undefined, sharedPost: undefined, reactions: [] }
              : msg;
            return (
              <BubbleWrapper
                item={displayMsg}
                fromMe={fromMe}
                isFirstOfGroup={item.isFirstOfGroup}
                isLastOfGroup={item.isLastOfGroup}
                avatar={fromMe ? null : userPhoto}
                colors={c}
                timeStr={formatTime(msg.createdAt)}
                senderVip={fromMe ? myVip : otherVip}
                selected={selectedMsgIds.has(msg.id)}
                isSelecting={isMsgSelecting}
                isDeleted={isDeleted}
                onMsgPress={handleMsgPress}
                onMsgLongPress={handleMsgLongPress}
                onReact={handleReact}
                myUid={myUid}
                showReactionBar={activeReactionMsgId === msg.id}
                onToggleReaction={handleToggleReaction}
                onSwipeReply={handleSwipeReply}
              />
            );
          }}
        />

        {/* Typing indicator */}
        {isOtherTyping && (
          <Animated.View entering={FadeIn.duration(200)} style={[styles.typingWrap, { backgroundColor: c.card, borderTopColor: c.border }]}>
            <View style={styles.typingDots}>
              <TypingDot delay={0} color={c.primary} />
              <TypingDot delay={200} color={c.primary} />
              <TypingDot delay={400} color={c.primary} />
            </View>
            <Text style={[styles.typingText, { color: c.textMuted }]}>{user?.name ?? ""} {t("chat_typing")}</Text>
          </Animated.View>
        )}

        {/* Reply banner */}
        {replyingTo && (
          <View style={[styles.replyBanner, { backgroundColor: c.surface, borderTopColor: c.border, borderLeftColor: c.primary }]}>
            <View style={styles.replyBannerBody}>
              <Text style={[styles.replyBannerName, { color: c.primary }]}>
                {replyingTo.senderId === myUid ? t("chat_self") : user?.name ?? ""}
              </Text>
              <Text style={[styles.replyBannerText, { color: c.textMuted }]} numberOfLines={1}>
                {replyingTo.type === "image" ? `📷 ${t("chat_photo")}` : replyingTo.type === "video" ? `🎥 ${t("chat_video")}` : replyingTo.text}
              </Text>
            </View>
            <Pressable onPress={() => setReplyingTo(null)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="close" size={18} color={c.textMuted} />
            </Pressable>
          </View>
        )}

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
              placeholder={t("chat_message_placeholder")}
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
            <VoiceRecorder colors={c} onSend={sendVoice} />
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
                <Text style={[styles.panelTabLabel, { color: panelTab === "emoji" ? c.primary : c.textMuted }]}>{t("chat_emoji_tab")}</Text>
                {panelTab === "emoji" && <View style={[styles.panelTabUnderline, { backgroundColor: c.primary }]} />}
              </Pressable>
              <Pressable onPress={() => switchTab("gift")} style={styles.panelTabBtn}>
                <Ionicons name="gift-outline" size={20} color={panelTab === "gift" ? c.primary : c.textMuted} />
                <Text style={[styles.panelTabLabel, { color: panelTab === "gift" ? c.primary : c.textMuted }]}>{t("chat_gift_tab")}</Text>
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
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#D4AF37" }}>{t("chat_vip_gifts")}</Text>
                    <Text style={{ fontSize: 13, color: c.textMuted, textAlign: "center" }}>
                      {t("chat_vip_gifts")}
                    </Text>
                    <Pressable
                      onPress={() => { setPanelTab(null); router.push("/premium"); }}
                      style={{ backgroundColor: "#D4AF37", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 4 }}
                    >
                      <Text style={{ color: "#000", fontWeight: "800", fontSize: 14 }}>{t("matches_go_premium")}</Text>
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
            <Text style={[styles.attachTitle, { color: c.text }]}>{t("posts_share")}</Text>
            <View style={styles.attachGrid}>
              {[
                { icon: "camera", label: t("chat_camera"), color: "#7C3AED" },
                { icon: "images", label: t("chat_gallery"), color: "#2563EB" },
                { icon: "videocam", label: t("posts_video"), color: "#DC2626" },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.attachItem}
                  onPress={async () => {
                    setAttachOpen(false);
                    if (item.icon === "camera") {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== "granted") { showAlert(t("setup_permission_title"), t("chat_permission_camera")); return; }
                      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
                      if (!res.canceled && res.assets[0]) {
                        await sendImage(res.assets[0].uri, "image");
                      }
                    } else if (item.icon === "images") {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== "granted") { showAlert(t("setup_permission_title"), t("chat_permission_gallery")); return; }
                      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
                      if (!res.canceled && res.assets[0]) {
                        await sendImage(res.assets[0].uri, "image");
                      }
                    } else if (item.icon === "videocam") {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== "granted") { showAlert(t("setup_permission_title"), t("chat_permission_gallery")); return; }
                      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 0.8 });
                      if (!res.canceled && res.assets[0]) {
                        await sendImage(res.assets[0].uri, "video");
                      }
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
  onSwipeReply,
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
  onSwipeReply: (msg: ChatMessage) => void;
}) {
  const handlePress = useCallback(() => onMsgPress(item.id), [item.id, onMsgPress]);
  const handleLongPress = useCallback(() => onMsgLongPress(item.id), [item.id, onMsgLongPress]);
  const handleReact = useCallback((emoji: string) => onReact(item.id, emoji), [item.id, onReact]);
  const handleToggle = useCallback(() => onToggleReaction(item.id), [item.id, onToggleReaction]);

  // Swipe-to-reply gesture
  const translateX = useSharedValue(0);
  const swipeTriggered = useRef(false);
  const panGesture = Gesture.Pan()
    .activeOffsetX([-999, 30]) // sadece saga kaydirma
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      if (isDeleted) return;
      const clamp = Math.min(e.translationX, 80);
      translateX.value = Math.max(0, clamp);
      if (clamp >= 60 && !swipeTriggered.current) {
        swipeTriggered.current = true;
        runOnJS(onSwipeReply)(item);
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      swipeTriggered.current = false;
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyIconStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / 40, 1),
    transform: [{ scale: Math.min(translateX.value / 60, 1) }],
  }));

  return (
    <View style={{ position: "relative" }}>
      {/* Swipe reply icon */}
      <Animated.View style={[styles.swipeReplyIcon, replyIconStyle]} pointerEvents="none">
        <Ionicons name="arrow-undo" size={20} color={colors.primary} />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={swipeStyle}>
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
        </Animated.View>
      </GestureDetector>
    </View>
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
  const { t } = useLanguage();
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
      delayLongPress={400}
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
              <Text style={styles.storyReplyLabelText}>{t("chat_story_reply")}</Text>
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
            <Text style={[styles.sharedPostTapHintText, { color: c.textMuted }]}>{t("chat_go_posts")}</Text>
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
      ) : (msg.type === "image" || msg.type === "video") && msg.imageUrl ? (
        <View style={[styles.imageBubble, bubbleRadius, fromMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
          <Image
            source={{ uri: msg.imageUrl }}
            style={styles.imageBubbleImg}
            resizeMode="cover"
          />
          {msg.type === "video" && (
            <View style={styles.videoPlayOverlay}>
              <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.85)" />
            </View>
          )}
          <View style={[styles.imageBubbleMeta, fromMe ? { right: 8 } : { left: 8 }]}>
            <Text style={styles.imageBubbleTime}>{timeStr}</Text>
            {fromMe && msg.status && (
              <Ionicons
                name={msg.status === "read" ? "checkmark-done" : "checkmark"}
                size={13}
                color={msg.status === "read" ? "#7DD3FC" : "rgba(255,255,255,0.85)"}
              />
            )}
          </View>
        </View>
      ) : msg.type === "audio" && msg.audioUrl ? (
        <VoiceMessageBubble
          id={msg.id}
          url={msg.audioUrl}
          durationMillis={msg.audioDuration || 0}
          fromMe={fromMe}
          colors={c}
          timeStr={timeStr}
          statusIcon={
            fromMe && msg.status ? (
              <Ionicons
                name={msg.status === "read" ? "checkmark-done" : "checkmark"}
                size={13}
                color={msg.status === "read" ? "#7DD3FC" : "rgba(255,255,255,0.7)"}
              />
            ) : null
          }
        />
      ) : msg.gift ? (
        <View style={[styles.giftBubble, { backgroundColor: hexToRgba(msg.gift.color, 0.13), borderColor: msg.gift.color }]}>
          <Text style={styles.giftBubbleEmoji}>{msg.gift.emoji}</Text>
          <Text style={[styles.giftBubbleName, { color: c.text }]}>{msg.gift.nameKey ? t(msg.gift.nameKey) : (msg.gift as any).name}</Text>
          <View style={styles.giftBubblePrice}>
            <Text style={{ fontSize: 12 }}>🪙</Text>
            <Text style={[styles.giftBubblePriceText, { color: c.textMuted }]}>{msg.gift.price}</Text>
          </View>
          <Text style={[styles.giftBubbleTag, { color: msg.gift.color }]}>
            {fromMe ? t("chat_gift_sent") : t("chat_gift_received")}
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
          {msg.replyTo && !isDeleted && (
            <View style={[styles.replyQuote, { backgroundColor: fromMe ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)", borderLeftColor: c.primary }]}>
              <Text style={[styles.replyQuoteName, { color: fromMe ? "rgba(255,255,255,0.9)" : c.primary }]} numberOfLines={1}>
                {msg.replyTo.senderId === myUid ? t("chat_you") : ""}
              </Text>
              <Text style={[styles.replyQuoteText, { color: fromMe ? "rgba(255,255,255,0.7)" : c.textMuted }]} numberOfLines={1}>
                {msg.replyTo.text || `📷 ${t("chat_media")}`}
              </Text>
            </View>
          )}
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

function ChatSkeleton({ colors: c }: { colors: any }) {
  const shimmer = useSharedValue(0.3);
  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));
  const lines = [
    { w: "55%", align: "flex-end" as const },
    { w: "70%", align: "flex-start" as const },
    { w: "45%", align: "flex-end" as const },
    { w: "60%", align: "flex-start" as const },
    { w: "50%", align: "flex-end" as const },
  ];
  return (
    <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 16, gap: 12, justifyContent: "flex-end" }}>
      {lines.map((l, i) => (
        <Animated.View
          key={i}
          style={[animStyle, {
            alignSelf: l.align,
            width: l.w as any,
            height: 38,
            borderRadius: 16,
            backgroundColor: c.surface,
          }]}
        />
      ))}
    </View>
  );
}

function DateSeparator({ label, colors: c }: { label: string; colors: any }) {
  return (
    <View style={styles.dateSepWrap}>
      <View style={[styles.dateSepPill, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.dateSepText, { color: c.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

function TypingDot({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
      )
    );
    opacity.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1, true
      )
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, dotStyle]} />
  );
}

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

  dateSepWrap: { alignItems: "center", marginVertical: 10 },
  dateSepPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateSepText: { fontSize: 11.5, fontWeight: "600" },

  matchedCard: {
    alignItems: "center",
    paddingVertical: 22,
    gap: 8,
  },
  loadOlderWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
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

  // Typing indicator
  typingWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  typingText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Reply banner (input üstünde)
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    marginHorizontal: 8,
    borderRadius: 4,
  },
  replyBannerBody: { flex: 1, gap: 2 },
  replyBannerName: { fontSize: 12, fontWeight: "700" },
  replyBannerText: { fontSize: 12 },

  // Reply quote (bubble icinde)
  replyQuote: {
    borderLeftWidth: 2.5,
    borderRadius: 4,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 8,
    marginBottom: 4,
  },
  replyQuoteName: { fontSize: 11, fontWeight: "700" },
  replyQuoteText: { fontSize: 11.5 },

  // Swipe reply icon
  swipeReplyIcon: {
    position: "absolute",
    left: 4,
    top: "50%",
    marginTop: -12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Image/Video bubble
  imageBubble: {
    maxWidth: "70%",
    marginHorizontal: 4,
    overflow: "hidden",
    position: "relative",
  },
  imageBubbleImg: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 16,
  },
  imageBubbleMeta: {
    position: "absolute",
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageBubbleTime: {
    fontSize: 10,
    color: "#fff",
  },

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
