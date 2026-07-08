const fs = require('fs');
const path = '/var/www/eslesbulus-api/src/routes/admin.js';
let code = fs.readFileSync(path, 'utf8');

const endpoint = `
// Bot AI test endpoint — gercek API ile test
router.post("/bot-test", async (req, res) => {
  try {
    const { getBotResponse } = require("../utils/botAI");
    const { getSettings } = require("../middleware/maintenance");
    const settings = await getSettings();

    const { message, botName, botAge, botCity, userName, dialog } = req.body;

    if (!message) return res.status(400).json({ error: "Mesaj gerekli" });

    const start = Date.now();
    const response = await getBotResponse({
      senderId: "admin-test",
      receiverId: "bot-test",
      message,
      dialog: dialog || "admin-test-session",
      botDetails: {
        bot_isim: botName || "Cansu",
        bot_yas: String(botAge || "24"),
        bot_sehir: botCity || "Istanbul",
      },
      userName: userName || "Admin",
      apiUrl: settings.botApiUrl || undefined,
      apiKey: settings.botApiKey || undefined,
    });

    const latency = Date.now() - start;

    if (response) {
      res.json({ response, latency });
    } else {
      res.json({ error: "AI yanit vermedi. API baglantisini kontrol edin.", latency });
    }
  } catch (err) {
    console.error("[bot-test] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
`;

// Insert before module.exports or at the end of routes
if (code.includes('module.exports')) {
  code = code.replace('module.exports', endpoint + '\nmodule.exports');
} else {
  code += endpoint;
}

fs.writeFileSync(path, code);
console.log('Bot test endpoint added OK');
