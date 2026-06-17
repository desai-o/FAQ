const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQ = require("../models/FAQ");
const UserQuery = require("../models/UserQuery");
const { trackEvent } = require("../services/eventService");

const searchSchema = z.object({
  body: z.object({
    keyword: z.string().max(200).optional(),
    keywords: z.array(z.string().max(80)).optional(),
    category: z.string().max(100).optional(),
    limit: z.number().min(1).max(50).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

router.post("/", validate(searchSchema), async (req, res) => {
  try {
    const { keyword, keywords } = req.body;

    let searchTerms = [];

    if (Array.isArray(keywords)) {
      searchTerms = keywords;
    } else if (keyword) {
      searchTerms = keyword.split(/\s+/);
    }

    searchTerms = searchTerms
      .map((term) => String(term).trim().toLowerCase())
      .filter(Boolean);

    if (searchTerms.length === 0) {
      return res.status(400).json({
        error: "At least one search keyword is required"
      });
    }

    const searchText = searchTerms.join(" ");

    await trackEvent({
      type: "search_performed",
      userId: "anonymous",
      targetType: "search",
      targetId: searchText,
      metadata: {
        terms: searchTerms
      }
    });

    if (isMongoAvailable()) {
      const faqResults = await FAQ.find(
        {
          $text: {
            $search: searchText
          }
        },
        {
          score: {
            $meta: "textScore"
          }
        }
      ).sort({
        score: {
          $meta: "textScore"
        }
      });

      const queryResults = await UserQuery.find(
        {
          $text: {
            $search: searchText
          }
        },
        {
          score: {
            $meta: "textScore"
          }
        }
      ).sort({
        score: {
          $meta: "textScore"
        }
      });

      return res.json({
        storage: "mongodb",
        keyword: searchText,
        results: {
          faqs: faqResults,
          userQueries: queryResults
        }
      });
    }

    const db = getSQLiteDb();

    const likePattern = `%${searchText}%`;

    const faqResults = await db.all(
      `
      SELECT *
      FROM faqs
      WHERE LOWER(question) LIKE LOWER(?)
         OR LOWER(answer) LIKE LOWER(?)
         OR LOWER(keywords) LIKE LOWER(?)
      ORDER BY updated_at DESC
      `,
      likePattern,
      likePattern,
      likePattern
    );

    const queryResults = await db.all(
      `
      SELECT *
      FROM user_queries
      WHERE LOWER(question) LIKE LOWER(?)
         OR LOWER(answer) LIKE LOWER(?)
      ORDER BY updated_at DESC
      `,
      likePattern,
      likePattern
    );

    return res.json({
      storage: "sqlite",
      keyword: searchText,
      results: {
        faqs: faqResults,
        userQueries: queryResults
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Search failed",
      details: error.message
    });
  }
});

module.exports = router;
