const { GoogleGenAI } = require("@google/genai");
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQTranslation = require("../models/FAQTranslation");
const FAQ = require("../models/FAQ");

let ai = null;
const rawKey = process.env.GEMINI_API_KEY || "";
if (rawKey) {
  ai = new GoogleGenAI({ apiKey: rawKey });
  console.log("[TranslationService] Gemini AI client initialized.");
} else {
  console.warn("[TranslationService] No GEMINI_API_KEY set. AI translations disabled.");
}

const LANGUAGE_DISPLAY_NAMES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  en: "English"
};

const LANGUAGE_ALIAS_MAP = {
  hindi: "hi",
  hin: "hi",
  tamil: "ta",
  telugu: "te",
  kannada: "kn",
  bengali: "bn",
  chinese: "zh",
  mandarin: "zh",
  japanese: "ja",
  spanish: "es",
  french: "fr",
  german: "de",
  english: "en",
  original: "en"
};

function normalizeLanguageCode(value) {
  if (!value || typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  return LANGUAGE_ALIAS_MAP[normalized] || normalized;
}

function getTargetName(language) {
  if (!language || typeof language !== "string") return language;
  const normalized = normalizeLanguageCode(language);
  return LANGUAGE_DISPLAY_NAMES[normalized] || language;
}

// Model preference order: flash-lite has highest free tier quota, then flash, then fallback
const TRANSLATION_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash"
];

async function translateContent(text, targetLanguage) {
  if (!text || typeof text !== "string") return { text: "", model: null, rateLimited: false };

  const displayLanguage = getTargetName(targetLanguage);
  console.log(`[Translation] Translating to ${displayLanguage} (code: ${targetLanguage})`);

  if (ai) {
    const prompt = `Translate the following text into ${displayLanguage}. Maintain the tone and layout. Return ONLY the translated text, no introductory comments.

Text:
${text}`;

    let allRateLimited = true;

    // Try each model in order until one succeeds
    for (const model of TRANSLATION_MODELS) {
      try {
        console.log(`[Translation] Trying model: ${model} for ${displayLanguage}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const result = response.text.trim();
        console.log(`[Translation] Success with ${model} for ${displayLanguage}: "${result.substring(0, 60)}..."`);
        return { text: result, model, rateLimited: false };
      } catch (err) {
        const isRateLimit = err.message && (
          err.message.includes("429") ||
          err.message.includes("RESOURCE_EXHAUSTED") ||
          err.message.includes("quota")
        );
        const isModelNotFound = err.message && (
          err.message.includes("404") ||
          err.message.includes("not found") ||
          err.message.includes("MODEL_NOT_FOUND")
        );

        if (isRateLimit) {
          console.warn(`[Translation] Rate limit hit on model ${model} for ${displayLanguage}, trying next model...`);
          // Continue to next model
        } else if (isModelNotFound) {
          console.warn(`[Translation] Model ${model} not available, trying next...`);
          allRateLimited = false; // Not a rate limit issue
          // Continue to next model
        } else {
          // Unexpected error — log and break out
          console.error(`[Translation] Gemini error on model ${model} for ${displayLanguage}: ${err.message}`);
          allRateLimited = false;
          break;
        }
      }
    }

    console.warn(`[Translation] All Gemini models failed for ${displayLanguage}. Using original text.`);
    return { text, model: null, rateLimited: allRateLimited };
  } else {
    console.warn("[Translation] Gemini AI not initialized. Using original text.");
  }

  return { text, model: null, rateLimited: false };
}

async function addFAQTranslation({ faqId, language, question, answer, userId }) {
  const db = getSQLiteDb();

  // 1. Resolve FAQ — try MongoDB first (handles both ObjectId and mongo_id string)
  let faqText = null;
  if (isMongoAvailable()) {
    try {
      // Try direct ObjectId lookup
      faqText = await FAQ.findById(faqId);
    } catch (_castErr) {
      // faqId is not a valid ObjectId — try mongo_id string field
    }
    if (!faqText) {
      try {
        faqText = await FAQ.findOne({ mongo_id: String(faqId) });
      } catch (err) {
        console.warn("[TranslationService] MongoDB secondary lookup failed:", err.message);
      }
    }
  }

  // Fallback to SQLite — handles integer ids and mongo_id strings
  if (!faqText) {
    try {
      faqText = await db.get(
        `SELECT question, answer FROM faqs WHERE id = ? OR mongo_id = ?`,
        faqId,
        String(faqId)
      );
    } catch (err) {
      console.warn("[TranslationService] SQLite FAQ lookup failed:", err.message);
    }
  }

  if (!faqText) {
    throw new Error(`FAQ not found for id: ${faqId}`);
  }

  const sourceQuestion = faqText.question || "";
  const sourceAnswer = faqText.answer || "";

  if (!sourceQuestion && !sourceAnswer) {
    throw new Error(`FAQ ${faqId} has no content to translate`);
  }

  // 2. Perform translations if not manually provided
  let translatedQuestion = question;
  let translatedAnswer = answer;
  let translatedBy = "user";
  let usedModel = null;
  let wasRateLimited = false;

  if (!translatedQuestion) {
    const result = await translateContent(sourceQuestion, language);
    translatedQuestion = result.text;
    usedModel = result.model;
    wasRateLimited = result.rateLimited;
    translatedBy = "ai";
  }
  if (!translatedAnswer) {
    const result = await translateContent(sourceAnswer, language);
    translatedAnswer = result.text;
    if (!usedModel) usedModel = result.model;
    if (result.rateLimited) wasRateLimited = true;
    translatedBy = "ai";
  }

  // If all models were rate-limited, throw so the route returns a meaningful error
  if (wasRateLimited && translatedBy === "ai" && !usedModel) {
    throw new Error("RATE_LIMIT: Gemini API daily quota exceeded. Please try again later or upgrade your API plan.");
  }

  const provenance = translatedBy === "user"
    ? `User ${userId || "anonymous"}`
    : (usedModel ? `Gemini (${usedModel})` : "AI Fallback");

  let savedMongoTranslation = null;

  // 3. Save to MongoDB (only if it's available and faqId is a valid ObjectId)
  if (isMongoAvailable()) {
    try {
      // Build a filter that works for both ObjectId and string IDs
      let mongoFilter;
      try {
        const mongoose = require("mongoose");
        const oid = new mongoose.Types.ObjectId(String(faqId));
        mongoFilter = { faqId: oid, language };
      } catch (_) {
        // faqId is not an ObjectId — skip MongoDB save for translation
        mongoFilter = null;
      }

      if (mongoFilter) {
        savedMongoTranslation = await FAQTranslation.findOneAndUpdate(
          mongoFilter,
          {
            faqId: mongoFilter.faqId,
            language,
            question: translatedQuestion,
            answer: translatedAnswer,
            translatedBy,
            translationProvenance: provenance
          },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      console.error("[TranslationService] Failed to save translation to MongoDB:", err.message);
    }
  }

  // 4. Save to SQLite
  try {
    const mongoIdStr = savedMongoTranslation ? String(savedMongoTranslation._id) : null;
    await db.run(
      `
      INSERT INTO faq_translations (mongo_id, faq_id, language, question, answer, translated_by, translation_provenance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(faq_id, language) DO UPDATE SET
        question = excluded.question,
        answer = excluded.answer,
        translated_by = excluded.translated_by,
        translation_provenance = excluded.translation_provenance
      `,
      mongoIdStr,
      String(faqId),
      language,
      translatedQuestion,
      translatedAnswer,
      translatedBy,
      provenance
    );
  } catch (err) {
    console.error("[TranslationService] Failed to save translation to SQLite:", err.message);
  }

  return {
    faqId,
    language,
    question: translatedQuestion,
    answer: translatedAnswer,
    translatedBy,
    translationProvenance: provenance
  };
}

module.exports = {
  translateContent,
  addFAQTranslation,
  normalizeLanguageCode
};
