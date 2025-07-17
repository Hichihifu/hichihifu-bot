require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require("express");
const { setupMorningGreeting } = require("./morning");
const { setupSpecialReminder } = require("./specialReminder");
const { askGemini } = require("./gemini");

// Khởi tạo bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "?";

// Bộ nhớ lưu hội thoại: Key = userId, Value = mảng hội thoại
const conversations = new Map();

// Tính năng chào buổi sáng & ngày đặc biệt
setupMorningGreeting(client);
setupSpecialReminder(client);

// Quản lý replies tự động cho server
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

// Bot sẵn sàng
client.once("ready", () => {
  console.log(`🤖 Bot đang chạy dưới tên ${client.user.tag}`);
});

// Xử lý tin nhắn
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const { content } = message;
  const lower = content.toLowerCase();
  const guildId = message.guild.id;
  const replies = loadReplies(guildId);
  const userId = message.author.id;

  /* ========== LỆNH QUẢN LÝ REPLIES ========== */
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

    const thinkingMsg = await message.channel.send("⏳ Đang suy nghĩ...");
    try {
      const response = await askGemini(question, conversations.get(userId));

      await thinkingMsg.delete();

      // Lưu hội thoại
      const history = conversations.get(userId) || [];
      history.push({ role: "user", text: question });
      history.push({ role: "bot", text: response });
      conversations.set(userId, history);

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🤖 Trả lời từ Gemini")
        .setDescription(response.slice(0, 4000))
        .setFooter({ text: "Powered by Google Gemini" });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await thinkingMsg.delete();
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
        const userHistory = conversations.get(userId) || [];
        const response = await askGemini(question, userHistory);

        await thinkingMsg.delete();

        userHistory.push({ role: "user", text: question });
        userHistory.push({ role: "bot", text: response });
        conversations.set(userId, userHistory);

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("🤖 Tiếp tục chủ đề")
          .setDescription(response.slice(0, 4000));

        return message.reply({ embeds: [embed] });
      } catch (err) {
        await thinkingMsg.delete();
        return message.reply("❌ Lỗi khi tiếp tục hội thoại.");
      }
    }
  }

  /* ========== TRẢ LỜI TỰ ĐỘNG ========== */
  if (replies[lower]) return message.channel.send(replies[lower]);
});

// Keep-alive cho Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_, res) => res.send("Bot is running!"));
app.listen(PORT, () => console.log(`🌐 Keep-alive chạy ở cổng ${PORT}`));

client.login(process.env.TOKEN);
