const axios = require("axios");

const DEFAULT_URL = "https://dp.apis.net.tr/v3beta";
const DEFAULT_KEY = "001a06d11bb9cc731a266cea1124b00e";

/**
 * Dating AI API'ye istek gonder
 * @param {Object} opts
 * @param {string} opts.senderId - gercek kullanicinin uid'si
 * @param {string} opts.receiverId - bot'un uid'si
 * @param {string} opts.message - kullanicinin mesaji
 * @param {string} opts.dialog - sohbet odasi ID (chatKey)
 * @param {Object} opts.botDetails - { bot_isim, bot_yas, bot_sehir }
 * @param {string} opts.userName - gercek kullanicinin adi
 * @param {string} [opts.apiUrl] - ozel API URL
 * @param {string} [opts.apiKey] - ozel API key
 * @returns {Promise<string|null>} bot yaniti veya null
 */
async function getBotResponse(opts) {
  const {
    senderId,
    receiverId,
    message,
    dialog,
    botDetails,
    userName,
    apiUrl,
    apiKey,
  } = opts;

  const url = apiUrl || DEFAULT_URL;
  const key = apiKey || DEFAULT_KEY;

  const payload = {
    senderId,
    receiverId,
    message,
    dialog,
    details: {
      bot_isim: botDetails.bot_isim || "Cansu",
      bot_yas: String(botDetails.bot_yas || "24"),
      bot_sehir: botDetails.bot_sehir || "İstanbul",
      user_isim: userName || "Kullanıcı",
    },
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      timeout: 30000,
    });

    const botMessage = res.data?.response?.message;
    return botMessage || null;
  } catch (err) {
    console.error("[BotAI] API error:", err.message);
    return null;
  }
}

module.exports = { getBotResponse };
