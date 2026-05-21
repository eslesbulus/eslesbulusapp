import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import type { UserProfile } from "@/context/AuthContext";
import { useInteractions } from "@/context/InteractionsContext";
import { VerifiedBadge } from "@/components/common/VerifiedBadge";
import { ReportSheet } from "@/components/common/ReportSheet";

type Props = {
  user: UserProfile;
  onPressHi: (u: UserProfile) => void;
  onPress?: (u: UserProfile) => void;
};

export function ProfileCardList({ user, onPressHi, onPress }: Props) {
  const { theme } = useTheme();
  const { hasSent } = useInteractions();
  const c = theme.colors;
  const sent = hasSent(user.uid);
  const [reportOpen, setReportOpen] = useState(false);
  const photo = user.photoURL || user.photos?.[0];

  return (
    <Pressable
      onPress={() => onPress?.(user)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.avatarWrap}>
        <Image source={{ uri: photo }} style={styles.avatar} />
        {user.online && (
          <View
            style={[
              styles.dot,
              { backgroundColor: c.online, borderColor: c.card },
            ]}
          />
        )}
        {user.vip && (
          <View style={[styles.vipBadge, { backgroundColor: c.secondary }]}>
            <Ionicons name="diamond" size={9} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.middle}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {user.name}, {user.age}
          </Text>
          {user.verified && <VerifiedBadge size={14} />}
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={c.textMuted} />
          <Text style={[styles.meta, { color: c.textMuted }]} numberOfLines={1}>
            {user.city}
          </Text>
          <View style={[styles.sep, { backgroundColor: c.textMuted }]} />
          <Text style={[styles.meta, { color: user.online ? c.online : c.textMuted }]}>
            {user.online ? "Çevrimiçi" : "Çevrimdışı"}
          </Text>
        </View>
        {user.bio ? (
          <Text style={[styles.bio, { color: c.textMuted }]} numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightActions}>
        <Pressable
          onPress={() => {
            if (sent) return;
            onPressHi(user);
          }}
          disabled={sent}
          style={({ pressed }) => [
            styles.hiBtn,
            sent
              ? { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }
              : { backgroundColor: c.primary, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
          hitSlop={8}
        >
          {sent ? (
            <>
              <Ionicons name="checkmark-circle" size={14} color={c.online} />
              <Text style={[styles.hiText, { color: c.text }]}>Gönderildi</Text>
            </>
          ) : (
            <Text style={styles.hiText}>Hi 👋</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setReportOpen(true)} hitSlop={8} style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
        </Pressable>
      </View>

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        type="user"
        targetName={user.name}
        targetId={user.uid}
        targetPhoto={photo ?? ""}
      />
    </Pressable>
  );
}

const AV = 60;

const styles = StyleSheet.create({
  row: {
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
  vipBadge: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  middle: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontSize: 15, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  meta: { fontSize: 12, fontWeight: "500" },
  sep: { width: 3, height: 3, borderRadius: 2, opacity: 0.5 },
  bio: { fontSize: 12, marginTop: 4 },
  rightActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  hiBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hiText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  moreBtn: { padding: 4 },
});
