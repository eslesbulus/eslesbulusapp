const fs = require("fs");
const IMPORT_LINE = 'import { showAlert } from "@/components/common/CustomAlert";';

const files = [
  "app/(auth)/login.tsx", "app/(auth)/register.tsx", "app/(onboarding)/profile-setup.tsx",
  "app/(tabs)/chat.tsx", "app/(tabs)/index.tsx", "app/(tabs)/posts.tsx", "app/chat/[id].tsx",
  "app/premium/coins.tsx", "app/premium/index.tsx", "app/profile/blocked-users.tsx",
  "app/profile/edit.tsx", "app/profile/support-ticket/[id].tsx", "app/story/[id].tsx",
  "app/user/[id].tsx", "components/chat/GiftSheet.tsx", "components/chat/VoiceRecorder.tsx",
  "components/common/ReportSheet.tsx", "components/discover/FilterSheet.tsx",
  "components/discover/ProfileCardAlbum.tsx", "components/discover/ProfileCardList.tsx",
  "components/posts/PostCard.tsx", "components/profile/MyPostsSection.tsx",
  "components/profile/VerificationSheet.tsx", "context/AuthContext.tsx",
];

let added = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let code = fs.readFileSync(f, "utf8");
  if (code.includes('from "@/components/common/CustomAlert"')) continue; // zaten var
  if (!/\bshowAlert\(/.test(code)) continue; // kullanmiyor

  const eol = code.includes("\r\n") ? "\r\n" : "\n";
  const lines = code.split(/\r?\n/);
  let insertAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/from\s+["']react-native["'];/.test(lines[i])) { insertAt = i; break; }
  }
  if (insertAt === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*import\s.*\sfrom\s/.test(lines[i])) insertAt = i;
    }
  }
  if (insertAt === -1) insertAt = 0;
  lines.splice(insertAt + 1, 0, IMPORT_LINE);
  fs.writeFileSync(f, lines.join(eol));
  added++;
  console.log("import eklendi:", f);
}
console.log("\nToplam:", added);
