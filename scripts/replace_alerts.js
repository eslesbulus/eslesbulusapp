const fs = require("fs");

const files = [
  "app/(auth)/login.tsx",
  "app/(auth)/register.tsx",
  "app/(onboarding)/profile-setup.tsx",
  "app/(tabs)/chat.tsx",
  "app/(tabs)/index.tsx",
  "app/(tabs)/posts.tsx",
  "app/chat/[id].tsx",
  "app/premium/coins.tsx",
  "app/premium/index.tsx",
  "app/profile/blocked-users.tsx",
  "app/profile/edit.tsx",
  "app/profile/support-ticket/[id].tsx",
  "app/story/[id].tsx",
  "app/user/[id].tsx",
  "components/chat/GiftSheet.tsx",
  "components/chat/VoiceRecorder.tsx",
  "components/common/ReportSheet.tsx",
  "components/discover/FilterSheet.tsx",
  "components/discover/ProfileCardAlbum.tsx",
  "components/discover/ProfileCardList.tsx",
  "components/posts/PostCard.tsx",
  "components/profile/MyPostsSection.tsx",
  "components/profile/VerificationSheet.tsx",
  "context/AuthContext.tsx",
];

const IMPORT_LINE = 'import { showAlert } from "@/components/common/CustomAlert";\n';
let changed = 0;

for (const f of files) {
  if (!fs.existsSync(f)) { console.log("SKIP (yok):", f); continue; }
  let code = fs.readFileSync(f, "utf8");
  const before = code;

  // 1) Alert.alert( -> showAlert(
  code = code.replace(/\bAlert\.alert\(/g, "showAlert(");

  // 2) showAlert import yoksa ekle (react-native import'undan sonra)
  if (!code.includes('from "@/components/common/CustomAlert"')) {
    const rnRe = /(import\s*\{[^}]*\}\s*from\s*["']react-native["'];\n)/;
    if (rnRe.test(code)) {
      code = code.replace(rnRe, `$1${IMPORT_LINE}`);
    } else {
      // yedek: ilk import satirindan sonra
      code = code.replace(/(^import .*\n)/m, `$1${IMPORT_LINE}`);
    }
  }

  if (code !== before) {
    fs.writeFileSync(f, code);
    changed++;
    console.log("OK ", f);
  } else {
    console.log("--  degisiklik yok:", f);
  }
}
console.log("\nToplam degisen dosya:", changed);
