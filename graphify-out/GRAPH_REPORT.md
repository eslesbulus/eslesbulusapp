# Graph Report - .  (2026-05-21)

## Corpus Check
- Large corpus: 72 files � ~1,031,573 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 386 nodes · 636 edges · 24 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.89)
- Token cost: 512 input · 280 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Screens & Navigation|App Screens & Navigation]]
- [[_COMMUNITY_Home Feed & Filters|Home Feed & Filters]]
- [[_COMMUNITY_Auth & Profile Setup|Auth & Profile Setup]]
- [[_COMMUNITY_Video  Voice Calling|Video / Voice Calling]]
- [[_COMMUNITY_Dependencies & Packages|Dependencies & Packages]]
- [[_COMMUNITY_Root Layout & Settings|Root Layout & Settings]]
- [[_COMMUNITY_User Profile & Messaging|User Profile & Messaging]]
- [[_COMMUNITY_Posts & Social Feed|Posts & Social Feed]]
- [[_COMMUNITY_Stories Feature|Stories Feature]]
- [[_COMMUNITY_Theme & Color System|Theme & Color System]]
- [[_COMMUNITY_EAS Build Config|EAS Build Config]]
- [[_COMMUNITY_Firebase Configuration|Firebase Configuration]]
- [[_COMMUNITY_Brand Visual Identity|Brand Visual Identity]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_App Icon Assets|App Icon Assets]]
- [[_COMMUNITY_Dating App Brand|Dating App Brand]]
- [[_COMMUNITY_Splash Screen Assets|Splash Screen Assets]]
- [[_COMMUNITY_Favicon & Web Assets|Favicon & Web Assets]]
- [[_COMMUNITY_Android Adaptive Icon|Android Adaptive Icon]]
- [[_COMMUNITY_Expo Version Constraints|Expo Version Constraints]]

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
- `PostsScreen()` --calls--> `useTheme()`  [EXTRACTED]
  app/(tabs)/posts.tsx → context/ThemeContext.tsx
- `HiMessageModal()` --calls--> `useTheme()`  [EXTRACTED]
  components/discover/HiMessageModal.tsx → context/ThemeContext.tsx
- `RootNavigator()` --calls--> `useTheme()`  [EXTRACTED]
  app/_layout.tsx → context/ThemeContext.tsx
- `LoginScreen()` --calls--> `useAuth()`  [EXTRACTED]
  app/(auth)/login.tsx → context/AuthContext.tsx
- `ProfileSetupScreen()` --calls--> `useAuth()`  [EXTRACTED]
  app/(onboarding)/profile-setup.tsx → context/AuthContext.tsx

## Hyperedges (group relationships)
- **Color Token System: Palette + Theme Variants + theme.ts** — theme_color_palette, theme_dark_theme, theme_light_theme, theme_ts_file [INFERRED 0.95]
- **Brand Identity: Primary + Primary Dark + Gold VIP** — theme_primary_color, theme_primary_dark_color, theme_secondary_gold [EXTRACTED 1.00]
- **Expo v54 Constraint: CLAUDE.md + AGENTS.md + Expo Docs** — claude_md_agents_ref, agents_expo_constraint, agents_expo_docs [EXTRACTED 1.00]

## Communities (24 total, 0 thin omitted)

### Community 0 - "App Screens & Navigation"
Cohesion: 0.06
Nodes (38): MOCK_USERS, buildTheme(), darkColors, lightColors, radius, spacing, Theme, ThemeColors (+30 more)

### Community 1 - "Home Feed & Filters"
Cohesion: 0.08
Nodes (34): activeFilterCount(), AGE_BOUND, applyFilters(), DEFAULT_FILTERS, Filters, build(), Gender, P() (+26 more)

### Community 2 - "Auth & Profile Setup"
Cohesion: 0.08
Nodes (30): RootNavigator(), LoginScreen(), styles, styles, CityPicker(), Props, styles, app (+22 more)

### Community 3 - "Video / Voice Calling"
Cohesion: 0.07
Nodes (28): CallScreen(), styles, { width: W, height: H }, EmojiPicker(), Props, styles, { width: W }, GiftAnimation() (+20 more)

### Community 4 - "Dependencies & Packages"
Cohesion: 0.05
Nodes (36): dependencies, expo, expo-blur, expo-constants, expo-image-picker, expo-linear-gradient, expo-linking, expo-router (+28 more)

### Community 5 - "Root Layout & Settings"
Cohesion: 0.08
Nodes (18): { height: H }, Props, REPORT_REASONS, styles, AuthProvider(), BlockedUser, BlockedUsersContext, BlockedUsersProvider() (+10 more)

### Community 6 - "User Profile & Messaging"
Cohesion: 0.11
Nodes (20): Props, styles, VerifiedBadge(), HI_MESSAGES, MockUser, Ctx, InteractionsContext, SentHi (+12 more)

### Community 7 - "Posts & Social Feed"
Cohesion: 0.13
Nodes (15): ReportSheet(), MOCK_POSTS, MockComment, MockPost, A(), CommentSheet(), { height: H }, Props (+7 more)

### Community 8 - "Stories Feature"
Cohesion: 0.15
Nodes (11): EASE, StoryScreen(), styles, timeAgo(), Props, StoryProgressBar(), styles, EMOJIS (+3 more)

### Community 9 - "Theme & Color System"
Cohesion: 0.24
Nodes (11): Eşleş Buluş Color Palette, Dark Theme (Default), Light Theme, Online Status Color (#4CAF50), Primary Color (Burgundy #800020), Primary Dark Color (#4C0013), Secondary Gold Color (#D4AF37), Token-Based Color System (+3 more)

### Community 10 - "EAS Build Config"
Cohesion: 0.25
Nodes (8): buildType, build, preview, production, cli, version, android, android

### Community 11 - "Firebase Configuration"
Cohesion: 0.29
Nodes (6): client, configuration_version, project_info, project_id, project_number, storage_bucket

### Community 12 - "Brand Visual Identity"
Cohesion: 0.48
Nodes (7): Brand Visual Identity, Deep Red and Peach Color Palette, Human Connection / Matching Theme, Heart Shape Motif, Eslesbulus App Logo, Low-Poly Geometric Design Style, Two People Silhouettes

### Community 13 - "TypeScript Config"
Cohesion: 0.33
Nodes (5): compilerOptions, paths, strict, extends, @/*

### Community 14 - "App Icon Assets"
Cohesion: 0.47
Nodes (6): App Icon, App Brand Identity, Light Gray / White Color Palette, Concentric Circles Motif, Grid Overlay / Safe Zone Guide, Minimalist Circular Design

### Community 15 - "Dating App Brand"
Cohesion: 0.70
Nodes (5): Brand Identity - Dating/Matching App, Color Palette - Deep Crimson/Rose/Peach, Heart Shape (Low-Poly Style), Eslesbulus App Logo, Two Human Figures (Silhouettes)

### Community 16 - "Splash Screen Assets"
Cohesion: 0.60
Nodes (5): Concentric Circles Design, Light Gray Color Palette, Splash Screen Icon, App Visual Identity, White Background

### Community 17 - "Favicon & Web Assets"
Cohesion: 0.50
Nodes (4): App Favicon (Black Cube Grid Icon), Brand Identity, Expo App, Visual Style - Monochrome Geometric

### Community 18 - "Android Adaptive Icon"
Cohesion: 1.00
Nodes (3): Adaptive Icon (App Icon), App Brand Identity, Minimal Concentric Circles Design

### Community 19 - "Expo Version Constraints"
Cohesion: 0.67
Nodes (3): Expo Version Constraint (v54), Expo v54 Documentation, CLAUDE.md Agent Reference

## Knowledge Gaps
- **150 isolated node(s):** `version`, `project_number`, `project_id`, `storage_bucket`, `client` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `App Screens & Navigation` to `Home Feed & Filters`, `Auth & Profile Setup`, `Video / Voice Calling`, `Root Layout & Settings`, `User Profile & Messaging`, `Posts & Social Feed`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `MockUser` connect `User Profile & Messaging` to `App Screens & Navigation`, `Home Feed & Filters`, `Video / Voice Calling`, `Root Layout & Settings`, `Stories Feature`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Auth & Profile Setup` to `Root Layout & Settings`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `version`, `project_number`, `project_id` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Screens & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.0563265306122449 - nodes in this community are weakly interconnected._
- **Should `Home Feed & Filters` be split into smaller, more focused modules?**
  _Cohesion score 0.07632850241545894 - nodes in this community are weakly interconnected._
- **Should `Auth & Profile Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.08362369337979095 - nodes in this community are weakly interconnected._