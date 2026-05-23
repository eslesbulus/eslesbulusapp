import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Alert,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight, FadeIn, FadeOut, SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useChats } from "@/hooks/useChats";
import { useUser } from "@/hooks/useUser";
import { VipName } from "@/components/common/VipName";
import { useEffect } from "react";

function formatChatTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins} dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

type ViewMode = "active" | "archived";

export default function ChatScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const {
    chats, archivedChats, loading,
    markRead, markReadBulk, deleteChat, deleteBulk,
    archiveChat, archiveBulk, unarchiveChat,
  } = useChats();

  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelecting = selectedIds.size > 0;

  const currentChats = viewMode === "active" ? chats : archivedChats;

  // Back handler — secim modundaysa secimi temizle
  useEffect(() => {
    if (!isSelecting) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedIds(new Set());
      return true;
    });
    return () => handler.remove();
  }, [isSelecting]);

  const toggleSelect = useCallback((otherUid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(otherUid)) next.delete(otherUid);
      else next.add(otherUid);
      return next;
    });
  }, []);

  const handlePress = useCallback((otherUid: string) => {
    if (isSelecting) {
      toggleSelect(otherUid);
    } else {
      markRead(otherUid);
      router.push(`/chat/${otherUid}`);
    }
  }, [isSelecting, toggleSelect, markRead, router]);

  const handleLongPress = useCallback((otherUid: string) => {
    if (!isSelecting) {
      setSelectedIds(new Set([otherUid]));
    }
  }, [isSelecting]);

  function handleBulkMarkRead() {
    markReadBulk([...selectedIds]);
    setSelectedIds(new Set());
  }

  function handleBulkArchive() {
    if (viewMode === "active") {
      archiveBulk([...selectedIds]);
    } else {
      [...selectedIds].forEach((uid) => unarchiveChat(uid));
    }
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    const count = selectedIds.size;
    Alert.alert(
      "Sohbetleri Sil",
      `${count} sohbeti silmek istediğine emin misin? Bu işlem geri alınamaz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            deleteBulk([...selectedIds]);
            setSelectedIds(new Set());
          },
        },
      ]
    );
  }

  function handleSelectAll() {
    if (selectedIds.size === currentChats.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentChats.map((c) => c.otherUid)));
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      {/* Selection Action Bar */}
      {isSelecting ? (
        <Animated.View
          entering={SlideInUp.duration(200)}
          exiting={SlideOutUp.duration(200)}
          style={[styles.selectionBar, { backgroundColor: c.primary }]}
        >
          <Pressable onPress={() => setSelectedIds(new Set())} hitSlop={8} style={styles.selBarBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.selBarCount}>{selectedIds.size}</Text>

          <View style={styles.selBarActions}>
            {viewMode === "active" && (
              <Pressable onPress={handleBulkMarkRead} hitSlop={8} style={styles.selBarBtn}>
                <Ionicons name="checkmark-done" size={22} color="#fff" />
              </Pressable>
            )}
            <Pressable onPress={handleBulkArchive} hitSlop={8} style={styles.selBarBtn}>
              <Ionicons name={viewMode === "active" ? "archive" : "arrow-undo"} size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={handleBulkDelete} hitSlop={8} style={styles.selBarBtn}>
              <Ionicons name="trash" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={handleSelectAll} hitSlop={8} style={styles.selBarBtn}>
              <Ionicons
                name={selectedIds.size === currentChats.length ? "checkbox" : "checkbox-outline"}
                size={20}
                color="#fff"
              />
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Sohbet</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>
            {chats.length > 0 ? `${chats.length} sohbet` : "Henüz sohbet yok"}
          </Text>
        </View>
      )}

      {/* Tabs: Aktif / Arşivlenenler */}
      {(archivedChats.length > 0 || viewMode === "archived") && !isSelecting && (
        <View style={[styles.tabRow, { borderBottomColor: c.border }]}>
          <Pressable
            onPress={() => { setViewMode("active"); setSelectedIds(new Set()); }}
            style={[styles.tab, viewMode === "active" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: viewMode === "active" ? c.primary : c.textMuted }]}>
              Sohbetler
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { setViewMode("archived"); setSelectedIds(new Set()); }}
            style={[styles.tab, viewMode === "archived" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          >
            <Ionicons
              name="archive-outline"
              size={15}
              color={viewMode === "archived" ? c.primary : c.textMuted}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, { color: viewMode === "archived" ? c.primary : c.textMuted }]}>
              Arşiv ({archivedChats.length})
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={currentChats}
        keyExtractor={(it) => it.chatId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>Yükleniyor...</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name={viewMode === "archived" ? "archive-outline" : "chatbubbles-outline"}
                size={36}
                color={c.textMuted}
              />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                {viewMode === "archived"
                  ? "Arşivlenmiş sohbet yok"
                  : "Kesfet sekmesinden birine mesaj gonder, sohbet burada acilir."}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 40).duration(250)}>
            <ChatRow
              otherUid={item.otherUid}
              lastMessage={item.lastMessage}
              lastMessageAt={item.lastMessageAt}
              unreadCount={item.unreadCount}
              colors={c}
              selected={selectedIds.has(item.otherUid)}
              isSelecting={isSelecting}
              onPress={() => handlePress(item.otherUid)}
              onLongPress={() => handleLongPress(item.otherUid)}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

function ChatRow({
  otherUid,
  lastMessage,
  lastMessageAt,
  unreadCount,
  colors: c,
  selected,
  isSelecting,
  onPress,
  onLongPress,
}: {
  otherUid: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  colors: any;
  selected: boolean;
  isSelecting: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { user } = useUser(otherUid);
  const photo = user?.photoURL || user?.photos?.[0];
  const name = user?.name || "...";
  const online = user?.online ?? false;
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: selected
            ? `${c.primary}18`
            : hasUnread
            ? `${c.primary}08`
            : c.card,
          borderColor: selected
            ? `${c.primary}50`
            : hasUnread
            ? `${c.primary}30`
            : c.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Selection checkbox */}
      {isSelecting && (
        <Animated.View entering={FadeIn.duration(150)}>
          <Ionicons
            name={selected ? "checkbox" : "square-outline"}
            size={22}
            color={selected ? c.primary : c.textMuted}
          />
        </Animated.View>
      )}

      <View style={styles.avatarWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: c.surface }]} />
        )}
        {online && (
          <View style={[styles.dot, { backgroundColor: c.online, borderColor: c.card }]} />
        )}
      </View>
      <View style={styles.middle}>
        <View style={styles.topRow}>
          <VipName
            name={name}
            vip={user?.vip}
            style={{ color: c.text, fontWeight: hasUnread ? "800" : "700" }}
            fontSize={15}
          />
          <Text style={[styles.time, { color: hasUnread ? c.primary : c.textMuted }]}>
            {formatChatTime(lastMessageAt)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.msg,
              {
                color: hasUnread ? c.text : c.textMuted,
                fontWeight: hasUnread ? "600" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          {hasUnread && (
            <View style={[styles.unreadBadge, { backgroundColor: c.primary }]}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const AV = 54;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 4 },

  // Selection bar
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  selBarBtn: { padding: 6 },
  selBarCount: { color: "#fff", fontSize: 18, fontWeight: "800", flex: 0 },
  selBarActions: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 4 },

  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabText: { fontSize: 14, fontWeight: "600" },

  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  empty: { alignItems: "center", padding: 32, gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center", maxWidth: 280 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrap: { width: AV, height: AV, position: "relative" },
  avatar: { width: AV, height: AV, borderRadius: AV / 2 },
  dot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  middle: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: { fontSize: 11, fontWeight: "500" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  msg: { fontSize: 13, flex: 1 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
});
