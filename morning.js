const { EmbedBuilder } = require("discord.js");

function setupMorningGreeting(client) {
  const CHANNEL_ID = process.env.CHANNEL_ID;
  const morningHour = 7;
  const morningMinute = 0;
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
          .setImage("https://media.tenor.com/1cIigwthwRIAAAAC/shirakami-fubuki-fubuki.gif")
          .setFooter({ text: "Gửi từ tình iu của chichi de thw ~" });

        channel.send({ embeds: [embed] });
        lastSentDate = today;
      }
    }
  }, 60 * 1000);
}

module.exports = { setupMorningGreeting };
