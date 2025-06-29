require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "/";

// --- Xử lý file trả lời riêng theo từng server ---
function getRepliesPath(guildId) {
  return path.join(__dirname, "replies", `${guildId}.json`);
}

function loadReplies(guildId) {
  const filePath = getRepliesPath(guildId);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } else {
    return {};
  }
}

function saveReplies(guildId, data) {
  const dir = path.join(__dirname, "replies");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(getRepliesPath(guildId), JSON.stringify(data, null, 2));
}

// --- Bot khởi động ---
client.once("ready", () => {
  console.log(`🤖 Bot đang chạy dưới tên ${client.user.tag}`);
});

// --- Xử lý tin nhắn ---
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  let replies = loadReplies(guildId);
  const content = message.content.trim();

  // --- Thêm câu trả lời ---
  if (content.startsWith(`${PREFIX}addreply`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send("❌ Bạn không có quyền sử dụng lệnh này.");
    }

    const splitIndex = content.indexOf("=>");
    if (splitIndex === -1) {
      return message.channel.send("📌 Định dạng đúng: `/addreply câu hỏi => câu trả lời`");
    }

    const key = content.slice(PREFIX.length + 8, splitIndex).trim().toLowerCase();
    const value = content.slice(splitIndex + 2).trim();

    if (!key || !value) {
      return message.channel.send("❗ Vui lòng nhập đầy đủ câu hỏi và câu trả lời.");
    }

    replies[key] = value;
    saveReplies(guildId, replies);
    return message.channel.send(`✅ Đã thêm: \`${key}\` → \`${value}\``);
  }

  // --- Xóa câu trả lời ---
  if (content.startsWith(`${PREFIX}delreply`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send("❌ Bạn không có quyền sử dụng lệnh này.");
    }

    const key = content.slice(PREFIX.length + 9).trim().toLowerCase();

    if (!key) {
      return message.channel.send("📌 Định dạng đúng: `/delreply câu hỏi`");
    }

    if (!replies[key]) {
      return message.channel.send("❗ Không tìm thấy câu trả lời với câu hỏi đó.");
    }

    delete replies[key];
    saveReplies(guildId, replies);
    return message.channel.send(`🗑️ Đã xóa câu hỏi: \`${key}\``);
  }

  // --- Liệt kê danh sách ---
  if (content.startsWith(`${PREFIX}listreplies`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.channel.send("❌ Bạn không có quyền sử dụng lệnh này.");
    }

    const keys = Object.keys(replies);
    if (keys.length === 0) {
      return message.channel.send("📭 Chưa có câu hỏi nào được lưu.");
    }

    const list = keys
      .map((key, index) => `${index + 1}. \`${key}\` → ${replies[key]}`)
      .join("\n")
      .slice(0, 1900); // tránh vượt giới hạn Discord

    return message.channel.send(`📋 **Danh sách câu hỏi đã lưu:**\n${list}`);
  }

  // --- Trả lời nếu khớp ---
  const lower = content.toLowerCase();
  if (replies[lower]) {
    return message.channel.send(replies[lower]);
  }
});

//chào buổi sáng
const { EmbedBuilder } = require("discord.js");
const CHANNEL_ID = process.env.CHANNEL_ID;

const morningHour = 7;    // 7 giờ sáng
const morningMinute = 0;  // 0 phút
let lastSentDate = null;

setInterval(() => {
  const nowUTC = new Date();
  const nowVN = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);

  const hour = nowVN.getHours();
  const minute = nowVN.getMinutes();
  const today = nowVN.toDateString();

  if (
    hour === morningHour &&
    minute === morningMinute &&
    lastSentDate !== today
  ) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor("#A7C7E7")
        .setTitle("Chào buổi sáng nhé")
        .setDescription("Sáng rùi server dậy đi nà~")
        .setImage("https://media1.tenor.com/m/1cIigwthwRIAAAAC/shirakami-fubuki-fubuki.gif")
        .setFooter({ text: "Gửi từ tình iu của chichi de thw ~" });

      channel.send({ embeds: [embed] });
      lastSentDate = today;
    }
  }
}, 60 * 1000);



client.login(process.env.TOKEN);
