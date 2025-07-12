const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

function setupSpecialReminder(client) {
  const CHANNEL_ID = process.env.CHANNEL_ID;
  const checkedDates = new Set();

  const specialDaysPath = path.join(__dirname, "specialDays.json");
  const rawData = fs.readFileSync(specialDaysPath);
  const specialDays = JSON.parse(rawData);

  const messages = {
    birthday: {
      title: "🎂 Sinh nhật bé cáo cuti",
      description: "Chúc mừng sinh nhật bé cáo xinh đẹp dễ thw s1tg 🥳 🎂 💖",
      image: "https://cdn.discordapp.com/attachments/979968377068060733/1393556912989147186/c2f221f558c9fb6a16cf6905fd28a9b5.jpg?ex=68739a83&is=68724903&hm=e2d6d6a85599edf2aee78eaa84a2df999f7ac95113e4695ae951240a88bb7fcb"
    },
    loveAnniversary: {
      title: "Anniversary",
      description: "Hôm nay là ngày chủ server và Hifu chính thức về với nhau nhé mọi người 💖",
      image: "https://cdn.donmai.us/original/fd/07/__shirakami_fubuki_hoshimachi_suisei_sakura_miko_and_sukonbu_hololive_drawn_by_g_teasp__fd07f6baf239d37912d9fb94c48393a2.jpg"
    },
  };

  setInterval(() => {
    const nowUTC = new Date();
    const nowVN = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
    const today = `${String(nowVN.getDate()).padStart(2, "0")}-${String(nowVN.getMonth() + 1).padStart(2, "0")}`;

    if (checkedDates.has(today)) return;

    const match = specialDays.find(day => day.date === today);
    if (match) {
      const message = messages[match.key];
      if (!message) return;

      const embed = new EmbedBuilder()
        .setColor("#A7C7E7")
        .setTitle(message.title)
        .setDescription(message.description)
        .setImage(message.image)

      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) channel.send({ embeds: [embed] });

      checkedDates.add(today);
    }
  }, 60 * 1000);
}

module.exports = { setupSpecialReminder };
