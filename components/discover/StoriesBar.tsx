import { useMemo } from "react";
import { ScrollView, View, Text, Image, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import type { UserProfile } from "@/context/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/context/AuthContext";
import { VipName } from "@/components/common/VipName";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  onPressUser?: (user: UserProfile) => void;
  onPressAdd?: () => void;
};

export function StoriesBar({ onPressUser, onPressAdd }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const s = styles(theme.colors);
  const { profile } = useAuth();
  const { users } = useUsers();
  const router = useRouter();
  const { storyUserIds, myStories, getStoriesForUser } = useStories();

  // Only users who have active stories, VIP first
  const storyUsers = useMemo(() => {
    const withStory = users.filter((u) => storyUserIds.has(u.uid));
    withStory.sort((a, b) => {
      if (a.vip && !b.vip) return -1;
      if (!a.vip && b.vip) return 1;
      return 0;
    });
    return withStory;
  }, [users, storyUserIds]);

  const hasMyStory = myStories.length > 0;
  // Hikayenin önizleme fotoğrafı (ilk hikayenin imageUrl'si)
  const myStoryPreview = myStories[0]?.imageUrl ?? null;

  function handlePressMyStory() {
    if (hasMyStory && profile) {
      router.push(`/story/${profile.uid}` as any);
    } else {
      onPressAdd?.();
    }
  }

  function handleAddMore() {
    onPressAdd?.();
  }

  return (
    <View style={s.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Add / My story button */}
        <Pressable onPress={handlePressMyStory} style={s.item}>
          {hasMyStory ? (
            <View>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.ring}
              >
                <View style={[s.inner, { backgroundColor: theme.colors.background }]}>
                  {(myStoryPreview || profile?.photoURL) ? (
                    <Image
                      source={{ uri: myStoryPreview || profile!.photoURL! }}
                      style={s.avatar}
                    />
                  ) : null}
                </View>
              </LinearGradient>
              <Pressable
                onPress={handleAddMore}
                style={[s.addBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}
                hitSlop={6}
              >
                <Text style={s.addBadgeText}>+</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[s.addOuter, { borderColor: theme.colors.border }]}>
              <View style={[s.addInner, { backgroundColor: theme.colors.surface }]}>
                <Text style={[s.plus, { color: theme.colors.primary }]}>+</Text>
              </View>
            </View>
          )}
          <Text style={s.name} numberOfLines={1}>
            {hasMyStory ? t("stories_my_story") : t("stories_add")}
          </Text>
        </Pressable>

        {storyUsers.map((u, i) => {
          // Kullanıcının hikaye önizleme fotoğrafı
          const storyPreview = getStoriesForUser(u.uid)[0]?.imageUrl;
          const profilePhoto = u.photoURL || u.photos?.[0];
          const displayPhoto = storyPreview || profilePhoto || null;
          return (
            <Animated.View key={u.uid} entering={FadeInRight.delay(i * 60).duration(350)}>
              <Pressable onPress={() => onPressUser?.(u)} style={s.item}>
                <LinearGradient
                  colors={u.vip ? ["#FFD700", "#FFA500", "#FFD700"] : [theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.ring}
                >
                  <View style={[s.inner, { backgroundColor: theme.colors.background }]}>
                    {displayPhoto ? <Image source={{ uri: displayPhoto }} style={s.avatar} /> : null}
                  </View>
                </LinearGradient>
                <VipName name={u.name} vip={u.vip} style={{ color: theme.colors.text }} fontSize={11} />
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const SIZE = 68;

const styles = (c: any) =>
  StyleSheet.create({
    wrap: { paddingVertical: 12 },
    scroll: { paddingHorizontal: 16, gap: 14 },
    item: { alignItems: "center", width: SIZE + 8 },
    ring: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      padding: 2.5,
      alignItems: "center",
      justifyContent: "center",
    },
    inner: {
      flex: 1,
      width: "100%",
      borderRadius: SIZE / 2,
      padding: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: { width: "100%", height: "100%", borderRadius: SIZE / 2 },
    addOuter: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      borderWidth: 2,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },
    addInner: {
      width: SIZE - 12,
      height: SIZE - 12,
      borderRadius: (SIZE - 12) / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    plus: { fontSize: 28, fontWeight: "300", lineHeight: 30 },
    addBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    addBadgeText: { color: "#fff", fontSize: 14, fontWeight: "700", lineHeight: 16 },
    name: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: "500",
      color: c.textMuted,
      maxWidth: SIZE + 4,
    },
  });
