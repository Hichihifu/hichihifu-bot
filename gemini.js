// gemini.js
require("dotenv").config(); // đề phòng trường hợp file này được require trước index.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("[Gemini] Không tìm thấy GEMINI_API_KEY trong biến môi trường!");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || ""); // tránh undefined
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Gọi Gemini với prompt văn bản và trả về chuỗi trả lời.
 * @param {string} question
 * @returns {Promise<string>}
 */
async function askGemini(question) {
  if (!GEMINI_API_KEY) {
    return "⚠️ Chưa cấu hình GEMINI_API_KEY, không thể gọi Gemini.";
  }

  try {
    const result = await model.generateContent(question);

    // Một số phiên bản SDK có .response.text(), nhưng kiểm tra an toàn:
    let text = "";
    if (result?.response?.text) {
      text = result.response.text();
    } else if (
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      text = result.response.candidates[0].content.parts[0].text;
    }

    text = (text || "").trim();
    if (!text) {
      text = "🤔 Gemini không trả về nội dung.";
    }
    return text;

  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error);
    return "❌ Lỗi khi gọi Gemini API.";
  }
}

module.exports = { askGemini };
