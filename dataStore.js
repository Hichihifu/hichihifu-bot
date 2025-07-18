// dataStore.js
const fs = require("fs");
const path = require("path");

// ---- Đường dẫn file ----
const userSettingsPath = path.join(__dirname, "userSettings.json");
const customAnswersPath = path.join(__dirname, "customAnswers.json");
const conversationsPath = path.join(__dirname, "conversations.json");

// ---- Load helpers ----
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error("[DataStore] Lỗi đọc JSON:", filePath, e);
    return {};
  }
}
function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[DataStore] Lỗi ghi JSON:", filePath, e);
  }
}

// ---- User Settings ----
function loadUserSettings() {
  return loadJson(userSettingsPath);
}
function saveUserSettings(data) {
  saveJson(userSettingsPath, data);
}

// ---- Custom Answers ----
function loadCustomAnswers() {
  return loadJson(customAnswersPath);
}
function saveCustomAnswers(data) {
  saveJson(customAnswersPath, data);
}

// ---- Conversations ----
// Lưu max N lượt (cắt bớt cho nhẹ)
const MAX_HISTORY = 10;

function loadConversations() {
  return loadJson(conversationsPath);
}
function saveConversations(data) {
  saveJson(conversationsPath, data);
}
function appendConversation(userId, role, text) {
  const convos = loadConversations();
  if (!convos[userId]) convos[userId] = [];
  convos[userId].push({ role, text });
  // Cắt bớt cho nhẹ
  if (convos[userId].length > MAX_HISTORY * 2) {
    // 2 vì user+bot = 2 entry/lượt
    convos[userId] = convos[userId].slice(-MAX_HISTORY * 2);
  }
  saveConversations(convos);
  return convos[userId];
}
function getConversationHistory(userId) {
  const convos = loadConversations();
  return convos[userId] || [];
}

module.exports = {
  loadUserSettings,
  saveUserSettings,
  loadCustomAnswers,
  saveCustomAnswers,
  loadConversations,
  saveConversations,
  appendConversation,
  getConversationHistory,
  MAX_HISTORY,
};
