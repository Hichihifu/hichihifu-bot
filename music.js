// music.js
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { SpotifyPlugin } = require("@distube/spotify");

/**
 * Hàm khởi tạo và cấu hình Distube
 * @param {Client} client - Discord client
 * @returns {DisTube}
 */
function setupMusic(client) {
  const distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: true,
    leaveOnEmpty: true,
    plugins: [
      new YtDlpPlugin(),
      new SpotifyPlugin(),
    ]
  });

  // Sự kiện khi phát bài
  distube.on("playSong", (queue, song) => {
    queue.textChannel.send(`🎶 Đang phát: \`${song.name}\``);
  });

  return distube;
}

module.exports = { setupMusic };
