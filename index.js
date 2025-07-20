require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require("express");
const { setupMorningGreeting } = require("./morning");
const { setupSpecialReminder } = require("./specialReminder");
const { askGemini } = require("./gemini");
/*const {
  loadUserSettings,
  saveUserSettings,
  loadCustomAnswers,
  saveCustomAnswers,
  appendConversation,
  getConversationHistory,
} = require("./dataStore");*/
const { backupToGitHub } = require('./backup');

/**
 * Khởi tạo Client với intents cần thiết
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "?";
let userSettings = loadUserSettings();
let customAnswers = loadCustomAnswers();
backupToGitHub(client);
/** ------------------------------------------------------------------
 *  Tính năng chào buổi sáng
 * -----------------------------------------------------------------*/
setupMorningGreeting(client);

/** ------------------------------------------------------------------
 *  Tính năng thông báo ngày đặc biệt
 * -----------------------------------------------------------------*/
setupSpecialReminder(client);

/** ------------------------------------------------------------------
 *  Các hàm lưu/đọc replies riêng cho từng server
 * -----------------------------------------------------------------*/
function getRepliesPath(guildId) {
  return path.join(__dirname, "replies", `${guildId}.json`);
}

function loadReplies(guildId) {
  const filePath = getRepliesPath(guildId);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return {};
}

function saveReplies(guildId, data) {
  const dir = path.join(__dirname, "replies");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(getRepliesPath(guildId), JSON.stringify(data, null, 2));
}

/** ------------------------------------------------------------------
 *  Sự kiện khởi động bot
 * -----------------------------------------------------------------*/
client.once("ready", () => {
  console.log(`🤖 Bot đang chạy dưới tên ${client.user.tag}`);
});

/** ------------------------------------------------------------------
 *  Xử lý tất cả message/lệnh trong một listener duy nhất
 * -----------------------------------------------------------------*/
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const { content } = message;
  const lower = content.toLowerCase();
  const userId = message.author.id;
  const guildId = message.guild.id;
  const replies = loadReplies(guildId);

  /* ========== CÁ NHÂN HÓA PHONG CÁCH ========== */
  if (lower.startsWith(`${PREFIX}setstyle`)) {
    const style = content.slice(`${PREFIX}setstyle`.length).trim();
    if (!style) return message.reply("❗ Vui lòng nhập style. Ví dụ: `?setstyle vui nhộn`");
    if (!userSettings[userId]) userSettings[userId] = {};
    userSettings[userId].style = style;
    saveUserSettings(userSettings);
    return message.reply(`✅ Đã đặt style cho bạn: ${style}`);
  }

  if (lower.startsWith(`${PREFIX}settone`)) {
    const tone = content.slice(`${PREFIX}settone`.length).trim();
    if (!tone) return message.reply("❗ Vui lòng nhập tone. Ví dụ: `?settone thân thiện`");
    if (!userSettings[userId]) userSettings[userId] = {};
    userSettings[userId].tone = tone;
    saveUserSettings(userSettings);
    return message.reply(`✅ Đã đặt tone cho bạn: ${tone}`);
  }

  if (lower.startsWith(`${PREFIX}mystyle`)) {
    const cfg = userSettings[userId] || {};
    return message.reply(
      `🎨 Phong cách hiện tại: Style = ${cfg.style || "mặc định"}, Tone = ${cfg.tone || "mặc định"}`
    );
  }

  /* ========== CUSTOM ANSWERS (override AI) ========== */
  if (lower.startsWith(`${PREFIX}addcustom`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("❌ Bạn không có quyền.");
    }
    const split = content.indexOf("=>");
    if (split === -1) {
      return message.reply("📌 Định dạng: `?addcustom câu hỏi => câu trả lời`");
    }
    const q = content.slice(PREFIX.length + 9, split).trim().toLowerCase();
    const a = content.slice(split + 2).trim();
    if (!q || !a) return message.reply("❗ Thiếu nội dung.");
    customAnswers[q] = a;
    saveCustomAnswers(customAnswers);
    return message.reply(`✅ Đã thêm custom: \`${q}\` → \`${a}\``);
  }

  if (lower.startsWith(`${PREFIX}listcustom`)) {
    const keys = Object.keys(customAnswers);
    if (!keys.length) return message.reply("📭 Chưa có custom answer.");
    const list = keys.map((k, i) => `${i + 1}. ${k} → ${customAnswers[k]}`).join("\n");
    return message.reply(`📋 **Custom answers:**\n${list}`);
  }

  /* ========== QUẢN LÝ REPLIES ========== */
  if (lower.startsWith(`${PREFIX}addreply`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send("❌ Bạn không có quyền sử dụng lệnh này.");
    }
    const split = content.indexOf("=>");
    if (split === -1) {
      return message.channel.send("📌 Định dạng đúng: `?addreply câu hỏi => câu trả lời`");
    }
    const key = content.slice(PREFIX.length + 8, split).trim().toLowerCase();
    const value = content.slice(split + 2).trim();
    if (!key || !value) {
      return message.channel.send("❗ Vui lòng nhập đầy đủ câu hỏi và câu trả lời.");
    }
    replies[key] = value;
    saveReplies(guildId, replies);
    return message.channel.send(`✅ Đã thêm: \`${key}\` → \`${value}\``);
  }

  if (lower.startsWith(`${PREFIX}delreply`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send("❌ Bạn không có quyền sử dụng lệnh này.");
    }
    const key = content.slice(PREFIX.length + 9).trim().toLowerCase();
    if (!key) return message.channel.send("📌 Định dạng đúng: `?delreply câu hỏi`");
    if (!replies[key]) return message.channel.send("❗ Không tìm thấy câu trả lời với câu hỏi đó.");
    delete replies[key];
    saveReplies(guildId, replies);
    return message.channel.send(`🗑️ Đã xóa câu hỏi: \`${key}\``);
  }

  if (lower.startsWith(`${PREFIX}listreplies`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send("❌ Bạn không có quyền sử dụng lệnh này.");
    }
    const keys = Object.keys(replies);
    if (keys.length === 0) return message.channel.send("📭 Chưa có câu hỏi nào được lưu.");
    const list = keys.map((k, i) => `${i + 1}. \`${k}\` → ${replies[k]}`).join("\n").slice(0, 1900);
    return message.channel.send(`📋 **Danh sách câu hỏi đã lưu:**\n${list}`);
  }

  /* ========== LỆNH ?ASK HỎI GEMINI ========== */
  if (lower.startsWith(`${PREFIX}ask`)) {
    const question = content.slice(PREFIX.length + 3).trim();
    if (!question) return message.reply("❗ Vui lòng nhập câu hỏi sau `?ask`.");

    const customHit = customAnswers[question.toLowerCase()];
    if (customHit) {
      appendConversation(userId, "user", question);
      appendConversation(userId, "bot", customHit);
      return message.reply(customHit);
    }

    const thinkingMsg = await message.channel.send("⏳ Đang suy nghĩ...");
    try {
      const history = getConversationHistory(userId);
      const userConfig = userSettings[userId] || {};
      const response = await askGemini(question, history, userConfig);

      try { await thinkingMsg.delete(); } catch (_) {}

      appendConversation(userId, "user", question);
      appendConversation(userId, "bot", response);

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🤖")
        .setDescription(response.slice(0, 4000))
        .setFooter({ text: "Hichihifu" });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      try { await thinkingMsg.delete(); } catch (_) {}
      return message.reply("❌ Có lỗi khi gọi Gemini API.");
    }
  }

  /* ========== TIẾP TỤC HỘI THOẠI (REPLY) ========== */
  if (message.reference && message.reference.messageId) {
    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
    if (repliedMessage.author.id === client.user.id) {
      const question = message.content.trim();
      const thinkingMsg = await message.channel.send("⏳ Đang suy nghĩ...");

      try {
        const history = getConversationHistory(userId);
        const userConfig = userSettings[userId] || {};
        const response = await askGemini(question, history, userConfig);

        try { await thinkingMsg.delete(); } catch (_) {}

        appendConversation(userId, "user", question);
        appendConversation(userId, "bot", response);

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("🤖")
          .setDescription(response.slice(0, 4000));

        return message.reply({ embeds: [embed] });
      } catch (err) {
        try { await thinkingMsg.delete(); } catch (_) {}
        return message.reply("❌ Lỗi khi tiếp tục hội thoại.");
      }
    }
  }

  /* ========== AUTO REPLY ========== */
  if (replies[lower]) return message.channel.send(replies[lower]);
});

/** ------------------------------------------------------------------
 * Keep-alive server cho Render
 * -----------------------------------------------------------------*/
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_, res) => res.send("Bot is running!"));
app.listen(PORT, () => console.log(`🌐 Keep-alive chạy ở cổng ${PORT}`));

/** ------------------------------------------------------------------
 * Đăng nhập bot
 * -----------------------------------------------------------------*/
client.login(process.env.TOKEN);
