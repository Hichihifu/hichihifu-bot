// gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function askGemini(question) {
  try {
    const result = await model.generateContent(question);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Không thể kết nối đến Gemini API.");
  }
}

module.exports = { askGemini };
