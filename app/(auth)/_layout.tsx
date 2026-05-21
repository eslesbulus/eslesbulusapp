import { createContext, useContext } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { VideoView, useVideoPlayer, VideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";

// Share a single video player across login/register to prevent black flash on transition
const VideoCtx = createContext<{ player: VideoPlayer } | null>(null);
export const useAuthVideo = () => useContext(VideoCtx);

export default function AuthLayout() {
  const player = useVideoPlayer(
    require("../../public/home/eslesbulus.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );

  return (
    <VideoCtx.Provider value={{ player }}>
      <View style={styles.root}>
        {/* Shared background video — always mounted, persists across screen transitions */}
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
          style={StyleSheet.absoluteFill}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
      </View>
    </VideoCtx.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
});
