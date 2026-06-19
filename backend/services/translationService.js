const { GoogleGenAI } = require("@google/genai");
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQTranslation = require("../models/FAQTranslation");
const FAQ = require("../models/FAQ");

let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

async function translateContent(text, targetLanguage) {
  if (!text || typeof text !== "string") return "";

  if (ai) {
    try {
      const prompt = `Translate the following text into ${targetLanguage}. Maintain the tone and layout. Return ONLY the translated text, no introductory comments.

Text:
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text.trim();
    } catch (err) {
      console.error("Gemini translation failed:", err.message);
    }
  }

  // Fallback translation representation
  return `[Translated to ${targetLanguage}] ${text}`;
}

async function addFAQTranslation({ faqId, language, question, answer, userId }) {
  const db = getSQLiteDb();

  // 1. Resolve FAQ first to ensure it exists and get canonical texts
  let faqText = null;
  if (isMongoAvailable()) {
    try {
      faqText = await FAQ.findById(faqId);
    } catch (err) {
      // ignore
    }
  }
  if (!faqText) {
    try {
      faqText = await db.get("SELECT question, answer FROM faqs WHERE id = ? OR mongo_id = ?", faqId, faqId);
    } catch (err) {
      // ignore
    }
  }

  if (!faqText) {
    throw new Error("FAQ not found");
  }

  // 2. Perform translations if not provided
  let translatedQuestion = question;
  let translatedAnswer = answer;
  let translatedBy = "user";

  if (!translatedQuestion) {
    translatedQuestion = await translateContent(faqText.question, language);
    translatedBy = "ai";
  }
  if (!translatedAnswer) {
    translatedAnswer = await translateContent(faqText.answer, language);
    translatedBy = "ai";
  }

  let savedMongoTranslation = null;

  // 3. Save to MongoDB
  if (isMongoAvailable()) {
    try {
      savedMongoTranslation = await FAQTranslation.findOneAndUpdate(
        { faqId, language },
        {
          question: translatedQuestion,
          answer: translatedAnswer,
          translatedBy,
          translationProvenance: translatedBy === "ai" ? "Gemini 2.5 Flash" : `User ${userId}`
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("Failed to save translation to MongoDB:", err.message);
    }
  }

  // 4. Save to SQLite
  try {
    const mongoIdStr = savedMongoTranslation ? String(savedMongoTranslation._id) : null;
    await db.run(
      `
      INSERT INTO faq_translations (mongo_id, faq_id, language, question, answer, translated_by, translation_provenance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faq_id, language) DO UPDATE SET question = excluded.question, answer = excluded.answer, translated_by = excluded.translated_by
      `,
      mongoIdStr,
      String(faqId),
      language,
      translatedQuestion,
      translatedAnswer,
      translatedBy,
      translatedBy === "ai" ? "Gemini 2.5 Flash" : `User ${userId}`
    );
  } catch (err) {
    console.error("Failed to save translation to SQLite:", err.message);
  }

  return {
    faqId,
    language,
    question: translatedQuestion,
    answer: translatedAnswer,
    translatedBy
  };
}

module.exports = {
  translateContent,
  addFAQTranslation
};
