// controllers/websiteBuilder.controller.js
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateWebsite = async (req, res) => {
  const { userGoal } = req.body;

  if (!userGoal) {
    return res.status(400).json({ error: "userGoal is required" });
  }

  const prompt = `
Build a multi-file website project for this goal:
"${userGoal}"

Respond only in the following JSON format inside a markdown code block:

\`\`\`json
{
  "projectName": "my-website",
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>..."
    },
    {
      "path": "style/style.css",
      "content": "body { ... }"
    },
    {
      "path": "js/script.js",
      "content": "console.log('Hello!');"
    }
  ]
}
\`\`\`
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction:
        "You are a professional web developer. Respond ONLY with JSON inside a code block that defines project folder, file paths, and code content. DO NOT include explanations.",
    });

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // Extract JSON from code block
    const match = text.match(/```json([\s\S]*?)```/) || [null, text];
    const jsonText = match[1]?.trim() || text;

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      return res.status(500).json({ error: "Failed to parse JSON from Gemini", raw: jsonText });
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("❌ Error generating website:", err.message);
    res.status(500).json({ error: "Failed to generate website", detail: err.message });
  }
};
