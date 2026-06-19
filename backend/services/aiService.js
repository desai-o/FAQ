const { GoogleGenAI } = require("@google/genai");
const { retrieveRelevantChunks } = require("./documentService");

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

async function queryRAG(question) {
  const chunks = await retrieveRelevantChunks(question, 4);
  let answerText = "";

  if (chunks.length === 0) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `The user is asking: "${question}". Answer their question directly, and politely note that no custom training documents have been uploaded yet.`,
    });
    answerText = response.text;
  } else {
    const context = chunks.map((c, i) => `[Source: ${c.filename}]\n${c.content}`).join("\n\n");
    const prompt = `
You are CrowdFAQ's AI Assistant. Your task is to answer the user's question based strictly on the provided context below. 

If the provided context does not contain the answer, answer the question generally using your own knowledge, but state clearly that the answer was not found in the uploaded documents.

Context:
${context}

Question:
${question}

Answer:
`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    answerText = response.text;
  }

  return {
    answer: answerText,
    sources: [...new Set(chunks.map(c => c.filename))]
  };
}

module.exports = {
  generateSummary,
  queryRAG
};