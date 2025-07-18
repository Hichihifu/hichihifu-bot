// gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lấy API Key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Hàm gọi Gemini với context + cá nhân hóa
 * @param {string} question - Câu hỏi của user
 * @param {Array} history - Danh sách hội thoại [{role:"user"|"bot", text:"..."}]
 * @param {object} userConfig - {style, tone}
 */
async function askGemini(question, history = [], userConfig = {}) {
  try {
    const style = userConfig.style || "tự nhiên";
    const tone = userConfig.tone || "thân thiện";

    // Prompt chính
    const baseInstruction = `
Bạn là một trợ lý AI thông minh và thân thiện, trả lời tự nhiên, giống con người.
Luôn trả lời bằng tiếng Việt, thêm emoji nếu phù hợp.
Phong cách: ${style}, Tone: ${tone}.
Đừng trả lời quá ngắn, hãy thêm ví dụ nếu phù hợp.
    `;

    // Gắn hội thoại trước (ngữ cảnh)
    const historyPrompt = history
      .map((h) => `${h.role === "user" ? "Người dùng" : "Bot"}: ${h.text}`)
      .join("\n");

    const fullPrompt = `
${baseInstruction}

Đây là hội thoại trước đó:
${historyPrompt}

Người dùng: ${question}
Bot:
    `;

    // Gọi API Gemini
    const result = await model.generateContent(fullPrompt);

    console.log("Gemini raw result:", JSON.stringify(result.response, null, 2));

    // Lấy text trả về
    const text =
      (result?.response?.text && result.response.text()) ||
      (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) ||
      "";

    return text.trim() || "🤔 Mình chưa nghĩ ra câu trả lời!";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Không thể kết nối đến Gemini API.");
  }
}

module.exports = { askGemini };
