// gemini.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("[Gemini] Không tìm thấy GEMINI_API_KEY trong biến môi trường!");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function askGemini(question) {
  if (!GEMINI_API_KEY) {
    return "⚠️ Chưa cấu hình GEMINI_API_KEY.";
  }

  try {
    const result = await model.generateContent(question);

    // Log toàn bộ phản hồi để debug
    console.log("Gemini raw result:", JSON.stringify(result, null, 2));

    // Parse dữ liệu trả về an toàn
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
