import { useMemo } from "react";
import { ScrollView, View, Text, Image, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import type { UserProfile } from "@/context/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/context/AuthContext";

type Props = {
  onPressUser?: (user: UserProfile) => void;
  onPressAdd?: () => void;
};

export function StoriesBar({ onPressUser, onPressAdd }: Props) {
  const { theme } = useTheme();
  const s = styles(theme.colors);
  const { profile } = useAuth();
  const { users } = useUsers();
  const { storyUserIds, myStories } = useStories();

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

  return (
    <View style={s.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Add / My story button */}
        <Pressable onPress={onPressAdd} style={s.item}>
          {hasMyStory ? (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.ring}
            >
              <View style={[s.inner, { backgroundColor: theme.colors.background }]}>
                {profile?.photoURL ? (
                  <Image source={{ uri: profile.photoURL }} style={s.avatar} />
                ) : null}
              </View>
            </LinearGradient>
          ) : (
            <View style={[s.addOuter, { borderColor: theme.colors.border }]}>
              <View style={[s.addInner, { backgroundColor: theme.colors.surface }]}>
                <Text style={[s.plus, { color: theme.colors.primary }]}>+</Text>
              </View>
            </View>
          )}
          <Text style={s.name} numberOfLines={1}>
            {hasMyStory ? "Hikayen" : "Ekle"}
          </Text>
        </Pressable>

        {storyUsers.map((u, i) => {
          const photo = u.photoURL || u.photos?.[0];
          return (
            <Animated.View key={u.uid} entering={FadeInRight.delay(i * 60).duration(350)}>
              <Pressable onPress={() => onPressUser?.(u)} style={s.item}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.ring}
                >
                  <View style={[s.inner, { backgroundColor: theme.colors.background }]}>
                    {photo ? <Image source={{ uri: photo }} style={s.avatar} /> : null}
                  </View>
                </LinearGradient>
                <Text style={s.name} numberOfLines={1}>
                  {u.name}
                </Text>
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
    name: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: "500",
      color: c.textMuted,
      maxWidth: SIZE + 4,
    },
  });
