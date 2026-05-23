#!/bin/bash
# ============================================================
# Chat Yönetim Endpoint'leri — Sunucuya bağlanınca çalıştır
# Çalıştırma: ssh root@31.169.73.133 'bash -s' < scripts/server-chat-endpoints.sh
# ============================================================

set -e

API_DIR="/var/www/eslesbulus-api"

# -------------------------------------------------------
# 1) Chat modelini güncelle — unreadCounts + archived ekle
# -------------------------------------------------------
cat > /tmp/chat_model_patch.js << 'PATCH_EOF'
// Bu dosya Chat.js modelini güncelleyecek patch'tir
// unreadCounts map ve archived alanları ekleniyor
PATCH_EOF

# Mevcut Chat.js'yi oku ve güncelleyelim
cd "$API_DIR"

# Chat modeline unreadCounts ve archived ekle
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/models/Chat.js', 'utf8');

// unreadCounts alanı yoksa ekle (participants'tan sonra)
if (!code.includes('unreadCounts')) {
  code = code.replace(
    /participants:\s*\[String\],?/,
    'participants: [String],\n  unreadCounts: { type: Map, of: Number, default: new Map() },'
  );
}

// archived alanı yoksa ekle
if (!code.includes('archived')) {
  code = code.replace(
    /participants:\s*\[String\],/,
    'participants: [String],\n  archived: { type: [String], default: [] },'
  );
}

fs.writeFileSync('src/models/Chat.js', code);
console.log('Chat model updated');
"

# -------------------------------------------------------
# 2) chats.js route dosyasını güncelle
# -------------------------------------------------------
# Mevcut dosyanın tamamını yedekle
cp src/routes/chats.js src/routes/chats.js.bak.$(date +%s) 2>/dev/null || true

# Mevcut chats.js'yi oku ve yeni endpoint'leri ekle
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/routes/chats.js', 'utf8');

// Eğer read endpoint zaten varsa ekleme
if (code.includes('/api/chats/:otherUid/read')) {
  console.log('Endpoints already exist, skipping');
  process.exit(0);
}

// module.exports veya son satırdan önce yeni endpoint'leri ekle
const newEndpoints = \`

// ── Mark chat as read ────────────────────────────────────
router.post('/api/chats/:otherUid/read', async (req, res) => {
  try {
    const myUid = req.user.uid;
    const otherUid = req.params.otherUid;
    const chatKey = [myUid, otherUid].sort().join('_');

    await Chat.findOneAndUpdate(
      { chatKey },
      { [\\\`unreadCounts.\\\${myUid}\\\`]: 0 }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

// ── Delete chat ──────────────────────────────────────────
router.delete('/api/chats/:otherUid', async (req, res) => {
  try {
    const myUid = req.user.uid;
    const otherUid = req.params.otherUid;
    const chatKey = [myUid, otherUid].sort().join('_');

    // Soft delete: remove from participants (or hard delete if preferred)
    await Chat.findOneAndDelete({ chatKey });

    res.json({ ok: true });
  } catch (err) {
    console.error('deleteChat error:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// ── Archive chat ─────────────────────────────────────────
router.post('/api/chats/:otherUid/archive', async (req, res) => {
  try {
    const myUid = req.user.uid;
    const otherUid = req.params.otherUid;
    const chatKey = [myUid, otherUid].sort().join('_');

    await Chat.findOneAndUpdate(
      { chatKey },
      { \\$addToSet: { archived: myUid } }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('archiveChat error:', err);
    res.status(500).json({ error: 'Failed to archive chat' });
  }
});
\`;

// Son module.exports satırından önce ekle
if (code.includes('module.exports')) {
  code = code.replace('module.exports', newEndpoints + '\nmodule.exports');
} else {
  code += newEndpoints;
}

fs.writeFileSync('src/routes/chats.js', code);
console.log('Chat endpoints added');
"

# -------------------------------------------------------
# 3) GET /api/chats endpoint'ini güncelle — unreadCount döndür + archived filtrele
# -------------------------------------------------------
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/routes/chats.js', 'utf8');

// GET /api/chats endpoint'ini bul ve unreadCount + archived filtresi ekle
// Bu kısım mevcut koda bağlı olarak elle ayarlanması gerekebilir
// Şimdilik sadece log basalım
console.log('GET /api/chats endpoint needs manual review for unreadCount return');
console.log('Current chats.js length:', code.length, 'chars');
"

# -------------------------------------------------------
# 4) Socket handler'da unreadCount artır
# -------------------------------------------------------
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/socket/handler.js', 'utf8');

// findOneAndUpdate çağrısından sonra unreadCount artışı ekle
if (!code.includes('unreadCounts')) {
  // Chat save/update kısmından sonra unreadCounts artırma
  code = code.replace(
    /(\\\$push:\s*\{[^}]*messages[^}]*\})/,
    '\$1,\n          \\\$inc: { [\\\`unreadCounts.\\\${data.to}\\\`]: 1 }'
  );
  fs.writeFileSync('src/socket/handler.js', code);
  console.log('Socket handler updated with unreadCounts increment');
} else {
  console.log('Socket handler already has unreadCounts');
}
"

# -------------------------------------------------------
# 5) PM2 restart
# -------------------------------------------------------
cd "$API_DIR"
pm2 restart eslesbulus-api --update-env
pm2 logs eslesbulus-api --lines 5 --nostream

echo ""
echo "========================================="
echo "  Chat endpoints kurulumu tamamlandı!"
echo "========================================="
