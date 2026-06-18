const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateSummary(question, answers) {
  const prompt = `
Summarize this FAQ discussion.

Question:
${question}

Answers:
${answers.join("\n")}

Return:
- 3 bullet points
- Maximum 100 words
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}

module.exports = {
  generateSummary,
};