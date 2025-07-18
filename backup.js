const { exec } = require("child_process");

const GIT_USERNAME = process.env.GIT_USERNAME;
const GIT_TOKEN = process.env.GIT_TOKEN;
const GIT_REPO = process.env.GIT_REPO || "github.com/your-username/your-repo.git";
const BRANCH = process.env.GIT_BRANCH || "main";

function backupToGitHub() {
  console.log("🚀 Đang backup dữ liệu lên GitHub...");

  const remoteUrl = `https://${GIT_USERNAME}:${GIT_TOKEN}@${GIT_REPO}`;

  const commands = `
    git config --global user.email "${GIT_USERNAME}@users.noreply.github.com" &&
    git config --global user.name "${GIT_USERNAME}" &&
    git remote set-url origin ${remoteUrl} &&
    git fetch origin ${BRANCH} &&
    git reset --hard origin/${BRANCH} &&
    git add replies/ dataStore.js userSetting.json customAnswers.json conversations.json &&
    git commit -m "Auto backup data [$(date +'%Y-%m-%d %H:%M:%S')]" || echo "Không có thay đổi để commit" &&
    git push origin ${BRANCH}
  `;

  exec(commands, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Lỗi khi backup: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ Cảnh báo: ${stderr}`);
    }
    console.log(`✅ Backup thành công:\n${stdout}`);
  });
}

module.exports = { backupToGitHub };
