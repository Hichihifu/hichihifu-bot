// gemini.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("[Gemini] Không tìm thấy GEMINI_API_KEY trong biến môi trường!");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Gọi Gemini với ngữ cảnh hội thoại
 * @param {string} question - Câu hỏi mới
 * @param {Array} history - Danh sách {role, text}
 */
async function askGemini(question, history = []) {
  if (!GEMINI_API_KEY) {
    return "⚠️ Chưa cấu hình GEMINI_API_KEY.";
  }

  try {
    // Ghép ngữ cảnh cũ vào prompt
    const promptParts = history
      .map((item) => `${item.role === "user" ? "Người dùng" : "Bot"}: ${item.text}`)
      .join("\n");
    const fullPrompt = `${promptParts}\nNgười dùng: ${question}\nBot:`;

    const result = await model.generateContent(fullPrompt);

    console.log("Gemini raw result:", JSON.stringify(result, null, 2));

    let text =
      (result?.response?.text && result.response.text()) ||
      (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) ||
      "";

    text = (text || "").trim();
    return text || "🤔 Gemini không trả về nội dung.";
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error);
    return "❌ Lỗi khi gọi Gemini API.";
  }
}

module.exports = { askGemini };
