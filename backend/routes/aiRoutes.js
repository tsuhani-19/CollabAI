// backend/routes/ai.js
import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

router.post("/reply", async (req, res) => {
  const { prompt } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ✅ Correct prompt format for generateContent()
    const result = await model.generateContent(
      `Respond to this prompt clearly, with proper spacing, readable text, and well-formatted code if needed:\n\n${prompt}`
    );

    const response = await result.response;
    const rawText = response.text();

    // ✅ Cleanup formatting if needed
    const cleanedText = rawText
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, "\n$2\n") // removes ```js blocks
      .replace(/\*\*(.*?)\*\*/g, "$1")                // removes bold markdown
      .replace(/\n{3,}/g, "\n\n")                     // limits newlines
      .trim();

    res.json({ reply: cleanedText });
  } catch (error) {
    console.error("AI Error:", error.message || error);
    res.status(500).json({
      error: "Failed to get AI response",
      details: error.message,
    });
  }
});

export default router;
