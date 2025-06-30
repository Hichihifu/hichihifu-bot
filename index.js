client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  let replies = loadReplies(guildId);
  const content = message.content.trim();
  const lower = content.toLowerCase();

  // === Lệnh nhạc ===
  if (lower.startsWith("/play")) {
    const song = content.slice(5).trim();
    if (!message.member.voice.channel) {
      return message.channel.send("🔊 Bạn cần vào voice channel trước!");
    }
    distube.play(message.member.voice.channel, song, {
      member: message.member,
      textChannel: message.channel,
      message,
    });
    return;
  }

  if (lower.startsWith("/skip")) {
    distube.skip(message);
    return;
  }

  if (lower.startsWith("/stop")) {
    distube.stop(message);
    message.channel.send("⏹️ Đã dừng phát nhạc.");
    return;
  }

  // === Lệnh quản lý trả lời ===
  if (lower.startsWith(`${PREFIX}addreply`)) {
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

  if (lower.startsWith(`${PREFIX}delreply`)) {
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

  if (lower.startsWith(`${PREFIX}listreplies`)) {
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

  // === Trả lời tự động ===
  if (replies[lower]) {
    return message.channel.send(replies[lower]);
  }
});
