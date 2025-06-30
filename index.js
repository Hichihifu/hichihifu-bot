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
const { setupMusic } = require("./music");
const { setupMorningGreeting } = require("./morning");

// 1️⃣ Khởi tạo Client với intents cần thiết
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, // cần cho phát nhạc
  ],
});

const PREFIX = "?";

// 2️⃣ Khởi tạo Distube (phát nhạc) & Auto chào buổi sáng
const distube = setupMusic(client);
setupMorningGreeting(client);

// 3️⃣ Các hàm lưu/đọc replies riêng cho từng server
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

// 4️⃣ Sự kiện khởi động bot
client.once("ready", () => {
  console.log(`🤖 Bot đang chạy dưới tên ${client.user.tag}`);
  console.log(`📌 Prefix hiện tại là: ${PREFIX}`);
});

// 5️⃣ Xử lý tất cả message/lệnh trong một listener duy nhất
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const { content } = message;
  const lower = content.toLowerCase();
  const guildId = message.guild.id;
  const replies = loadReplies(guildId);

  // 🎵 LỆNH ÂM NHẠC
  if (lower.startsWith(`${PREFIX}play`)) {
    const song = content.slice(PREFIX.length + 4).trim();
    if (!message.member.voice.channel) {
      return message.channel.send("🔊 Bạn cần vào voice channel trước!");
    }
    return distube.play(message.member.voice.channel, song, {
      member: message.member,
      textChannel: message.channel,
      message,
    });
  }

  if (lower.startsWith(`${PREFIX}skip`)) {
    distube.skip(message);
    return;
  }

  if (lower.startsWith(`${PREFIX}stop`)) {
    distube.stop(message);
    message.channel.send("⏹️ Đã dừng phát nhạc.");
    return;
  }

  // 🤖 QUẢN LÝ REPLIES
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

  // 💬 TRẢ LỜI TỰ ĐỘNG
  if (replies[lower]) return message.channel.send(replies[lower]);
});

// 6️⃣ Keep-alive server cho Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_, res) => res.send("Bot is running!"));
app.listen(PORT, () => console.log(`🌐 Keep-alive chạy ở cổng ${PORT}`));

// 7️⃣ Đăng nhập bot
client.login(process.env.TOKEN);
