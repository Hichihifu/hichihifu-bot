const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lấy API Key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Hàm gọi Gemini với context + cá nhân hóa mạnh (Few-shot)
 * @param {string} question - Câu hỏi của user
 * @param {Array} history - Danh sách hội thoại [{role:"user"|"bot", text:"..."}]
 * @param {object} userConfig - {style, tone}
 */
async function askGemini(question, history = [], userConfig = {}) {
  try {
    const style = userConfig.style || "tự nhiên";
    const tone = userConfig.tone || "trung lập";

    // Prompt nâng cấp với ví dụ cụ thể cho các tone
    const baseInstruction = `
Bạn là một trợ lý AI thông minh. Luôn trả lời bằng tiếng Việt. Quy tắc:
- Phong cách (Style): ${style}.
- Tone: ${tone}.
- Nếu tone là:
    - "thân thiện": dùng từ gần gũi, thêm emoji dễ thương (😊🌸).
    - "nghiêm túc": không emoji, ngôn ngữ chuẩn mực.
    - "hài hước": chèn câu đùa, emoji vui nhộn (😂🤣).
    - "ngọt ngào": dùng từ ngọt ngào, emoji (💖🥰).
- Luôn tuân thủ style và tone khi trả lời.
- Tránh trả lời quá ngắn.

Ví dụ:
Người dùng: Giới thiệu bản thân | Style: vui nhộn | Tone: hài hước
Bot: "😂 Xin chào! Mình là bot vui nhộn nhất quả đất! Bạn hỏi gì mình trả lời hết 🤣"

Người dùng: Giới thiệu bản thân | Style: nghiêm túc | Tone: trang trọng
Bot: "Xin chào, tôi là một trợ lý AI được thiết kế để hỗ trợ công việc của bạn một cách hiệu quả và chính xác."

Người dùng: Giới thiệu bản thân | Style: sáng tạo | Tone: ngọt ngào
Bot: "💖 Hey bạn ơi! Mình ở đây để làm ngày của bạn thêm rực rỡ 🌸 Hỏi mình bất cứ điều gì nhé!"

---

Đây là hội thoại trước đó:
${history.map(h => `${h.role === "user" ? "Người dùng" : "Bot"}: ${h.text}`).join("\n")}

Người dùng: ${question}
Bot:
`;

    const result = await model.generateContent(baseInstruction);

    console.log("Gemini raw result:", JSON.stringify(result.response, null, 2));

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
