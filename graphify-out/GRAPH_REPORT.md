# Graph Report - .  (2026-05-21)

## Corpus Check
- 72 files · ~1,031,573 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 410 nodes · 660 edges · 28 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 49 edges
2. `MockUser` - 14 edges
3. `useAuth()` - 11 edges
4. `useInteractions()` - 11 edges
5. `Eşleş Buluş Color Palette` - 8 edges
6. `VerifiedBadge()` - 7 edges
7. `useBlockedUsers()` - 7 edges
8. `ReportSheet()` - 6 edges
9. `getUserById()` - 6 edges
10. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- `ChatScreen()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/chat.tsx → context/ThemeContext.tsx
- `PostsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/posts.tsx → context/ThemeContext.tsx
- `HiMessageModal()` --calls--> `useTheme()`  [EXTRACTED]
  components/discover/HiMessageModal.tsx → context/ThemeContext.tsx
- `RootNavigator()` --calls--> `useAuth()`  [EXTRACTED]
  app/_layout.tsx → context/AuthContext.tsx
- `RootNavigator()` --calls--> `useTheme()`  [EXTRACTED]
  app/_layout.tsx → context/ThemeContext.tsx

## Hyperedges (group relationships)
- **Color Token System: Palette + Theme Variants + theme.ts** — theme_color_palette, theme_dark_theme, theme_light_theme, theme_ts_file [INFERRED 0.95]
- **Brand Identity: Primary + Primary Dark + Gold VIP** — theme_primary_color, theme_primary_dark_color, theme_secondary_gold [EXTRACTED 1.00]
- **Expo v54 Constraint: CLAUDE.md + AGENTS.md + Expo Docs** — claude_md_agents_ref, agents_expo_constraint, agents_expo_docs [EXTRACTED 1.00]

## Communities (28 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (47): activeFilterCount(), AGE_BOUND, applyFilters(), DEFAULT_FILTERS, Filters, build(), Gender, MOCK_USERS (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (35): { height: H }, Props, REPORT_REASONS, ReportSheet(), styles, buildTheme(), darkColors, lightColors (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (29): CallScreen(), styles, { width: W, height: H }, CELL, EmojiPicker(), Props, styles, { width: W } (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (29): LoginScreen(), styles, styles, TERMS_SECTIONS, CityPicker(), Props, styles, app (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (36): dependencies, expo, expo-blur, expo-constants, expo-image-picker, expo-linear-gradient, expo-linking, expo-router (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (14): MOCK_POSTS, MockComment, MockPost, A(), CommentSheet(), { height: H }, Props, styles (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (17): Props, styles, VerifiedBadge(), VIP_USERS, getNotifUser(), MOCK_NOTIFS, Notif, notifLabel() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (11): EASE, StoryScreen(), styles, timeAgo(), Props, StoryProgressBar(), styles, EMOJIS (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (10): RootNavigator(), AuthProvider(), BlockedUser, BlockedUsersContext, BlockedUsersProvider(), Ctx, CoinsContext, CoinsContextType (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (8): PremiumContext, PremiumContextType, PremiumPlan, usePremium(), FEATURES, PACKAGES, PremiumScreen(), styles

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (11): Eşleş Buluş Color Palette, Dark Theme (Default), Light Theme, Online Status Color (#4CAF50), Primary Color (Burgundy #800020), Primary Dark Color (#4C0013), Secondary Gold Color (#D4AF37), Token-Based Color System (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (8): buildType, build, preview, production, cli, version, android, android

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (4): COIN_PACKAGES, HOW_TO, iconStyles, styles

### Community 13 - "Community 13"
Cohesion: 0.48
Nodes (7): Brand Visual Identity, Deep Red and Peach Color Palette, Human Connection / Matching Theme, Heart Shape Motif, Eslesbulus App Logo, Low-Poly Geometric Design Style, Two People Silhouettes

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (6): client, configuration_version, project_info, project_id, project_number, storage_bucket

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): HI_MESSAGES, HiMessageModal(), Props, styles

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (5): compilerOptions, paths, strict, extends, @/*

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (6): App Icon, App Brand Identity, Light Gray / White Color Palette, Concentric Circles Motif, Grid Overlay / Safe Zone Guide, Minimalist Circular Design

### Community 18 - "Community 18"
Cohesion: 0.70
Nodes (5): Brand Identity - Dating/Matching App, Color Palette - Deep Crimson/Rose/Peach, Heart Shape (Low-Poly Style), Eslesbulus App Logo, Two Human Figures (Silhouettes)

### Community 19 - "Community 19"
Cohesion: 0.60
Nodes (5): Concentric Circles Design, Light Gray Color Palette, Splash Screen Icon, App Visual Identity, White Background

### Community 20 - "Community 20"
Cohesion: 0.50
Nodes (4): App Favicon (Black Cube Grid Icon), Brand Identity, Expo App, Visual Style - Monochrome Geometric

### Community 21 - "Community 21"
Cohesion: 1.00
Nodes (3): Adaptive Icon (App Icon), App Brand Identity, Minimal Concentric Circles Design

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (3): Expo Version Constraint (v54), Expo v54 Documentation, CLAUDE.md Agent Reference

## Knowledge Gaps
- **161 isolated node(s):** `version`, `project_number`, `project_id`, `storage_bucket`, `client` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 8`, `Community 15`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `MockUser` connect `Community 0` to `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 8`, `Community 15`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 3` to `Community 8`, `Community 1`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `version`, `project_number`, `project_id` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05734767025089606 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05656565656565657 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06620209059233449 - nodes in this community are weakly interconnected._