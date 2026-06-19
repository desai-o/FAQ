const pdfParse = require("pdf-parse");
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");
const FAQ = require("../models/FAQ");
const UserQuery = require("../models/UserQuery");

function splitCSVRow(line) {
  const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
  return matches.map(m => m.replace(/^"|"$/g, "").trim());
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const questionIdx = headers.indexOf("question");
  const answerIdx = headers.indexOf("answer");
  const categoryIdx = headers.indexOf("category");
  const tagsIdx = headers.indexOf("tags");

  if (questionIdx === -1 || answerIdx === -1) {
    throw new Error("CSV must contain 'Question' and 'Answer' columns in the header row");
  }

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i]);
    const question = row[questionIdx];
    const answer = row[answerIdx];
    if (!question && !answer) continue;

    results.push({
      rowNum: i + 1,
      question: question || "",
      answer: answer || "",
      category: categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx] : "General",
      tags: tagsIdx !== -1 && row[tagsIdx] ? row[tagsIdx].split(";").map(t => t.trim()).filter(Boolean) : []
    });
  }
  return results;
}

function parseJSON(content) {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error("JSON import must be a top-level array of objects");
  }
  return data.map((item, idx) => ({
    rowNum: idx + 1,
    question: item.question || "",
    answer: item.answer || "",
    category: item.category || "General",
    tags: Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(",").map(t => t.trim()) : [])
  }));
}

function parseMarkdown(content) {
  const sections = content.split(/^#+\s+/m).filter(Boolean);
  const results = [];
  
  sections.forEach((sec, idx) => {
    const lines = sec.split(/\r?\n/);
    const question = lines[0].trim();
    const rest = lines.slice(1).join("\n").trim();
    if (!question && !rest) return;

    let answer = rest;
    let category = "General";
    let tags = [];

    const metaLines = rest.split(/\r?\n/);
    const cleanedAnswerLines = [];
    metaLines.forEach((line) => {
      if (line.toLowerCase().startsWith("category:")) {
        category = line.split(":")[1].trim();
      } else if (line.toLowerCase().startsWith("tags:")) {
        tags = line.split(":")[1].split(",").map(t => t.trim()).filter(Boolean);
      } else {
        cleanedAnswerLines.push(line);
      }
    });
    answer = cleanedAnswerLines.join("\n").trim();

    results.push({
      rowNum: idx + 1,
      question,
      answer,
      category,
      tags
    });
  });

  return results;
}

async function importContent({ format, content, userId, authorName, dryRun = false }) {
  let parsed = [];
  try {
    const fmt = String(format).toLowerCase().trim();
    if (fmt === "json") {
      parsed = parseJSON(content);
    } else if (fmt === "csv") {
      parsed = parseCSV(content);
    } else if (fmt === "markdown" || fmt === "md") {
      parsed = parseMarkdown(content);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  } catch (err) {
    return {
      status: "error",
      message: `Failed to parse content: ${err.message}`,
      errors: [{ row: 0, error: err.message }]
    };
  }

  const errors = [];
  const validRows = [];

  parsed.forEach((row) => {
    const rowErrors = [];
    if (!row.question || row.question.trim().length < 10) {
      rowErrors.push("Question must be at least 10 characters long");
    }
    if (!row.answer || row.answer.trim().length < 5) {
      rowErrors.push("Answer must be at least 5 characters long");
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: row.rowNum,
        question: row.question,
        errors: rowErrors
      });
    } else {
      validRows.push(row);
    }
  });

  // If there are validation errors, do not write anything (avoid partial corrupt imports)
  if (errors.length > 0) {
    return {
      status: "invalid",
      message: `${errors.length} rows failed validation. Bulk import aborted.`,
      errors
    };
  }

  if (dryRun) {
    return {
      status: "valid",
      message: `Validation successful. ${validRows.length} rows ready to import.`,
      preview: validRows
    };
  }

  // Perform actual import
  const imported = [];
  for (const row of validRows) {
    const tagsString = row.tags.join(",");
    
    if (isMongoAvailable()) {
      const faq = await FAQ.create({
        question: row.question,
        answer: row.answer,
        category: row.category,
        tags: row.tags,
        userId,
        authorName
      });

      // Sync to SQLite fallback
      try {
        const db = getSQLiteDb();
        await db.run(
          `INSERT INTO faqs (mongo_id, question, answer, category, tags, user_id, author_name)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          faq._id.toString(),
          row.question,
          row.answer,
          row.category,
          tagsString,
          userId,
          authorName
        );
      } catch (sqliteErr) {
        console.error("SQLite import fallback sync failed:", sqliteErr.message);
      }

      imported.push({ id: faq._id.toString(), question: row.question });
    } else {
      const db = getSQLiteDb();
      const result = await db.run(
        `INSERT INTO faqs (question, answer, category, tags, user_id, author_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        row.question,
        row.answer,
        row.category,
        tagsString,
        userId,
        authorName
      );

      imported.push({ id: result.lastID.toString(), question: row.question });
    }
  }

  return {
    status: "success",
    message: `Successfully imported ${imported.length} FAQs.`,
    imported
  };
}

async function generateThreadFromDocument({ fileBuffer, fileName, userId, authorName }) {
  let parsedText = "";

  if (fileName.toLowerCase().endsWith(".pdf")) {
    const data = await pdfParse(fileBuffer);
    parsedText = data.text;
  } else {
    parsedText = fileBuffer.toString("utf8");
  }

  if (!parsedText || parsedText.trim() === "") {
    throw new Error("Could not extract text from document");
  }

  let extractedQAs = [];

  if (process.env.NODE_ENV === "test" || !process.env.GEMINI_API_KEY) {
    // Test mode/fallback candidate FAQ
    extractedQAs = [
      {
        question: `Candidate FAQ from ${fileName}: Document Purpose`,
        description: `This question was automatically generated from ${fileName}.`,
        answer: "This is a placeholder answer extracted for test validation purposes."
      }
    ];
  } else {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
Extract candidate FAQ questions and answers from the following text extracted from a document.
Return ONLY a valid JSON array of objects, where each object has:
- "question" (string, the extracted question, must be clear and complete, at least 10 characters)
- "description" (string, context/details from the document, at least 5 characters)
- "answer" (string, the extracted answer, at least 5 characters)

Do not include any markdown formatting or prefix like \`\`\`json. Return only the JSON string.

Document Text:
${parsedText.substring(0, 10000)}
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const cleanJson = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      extractedQAs = JSON.parse(cleanJson);
    } catch (err) {
      console.error("Gemini document parsing failed, fallback active:", err.message);
      extractedQAs = [
        {
          question: `Candidate FAQ from ${fileName}: Document Summary`,
          description: `Extracted from ${fileName} due to AI parsing fallback.`,
          answer: parsedText.substring(0, 500)
        }
      ];
    }
  }

  const results = [];

  for (const item of extractedQAs) {
    const questionText = item.question || "Untitled extracted question";
    const descriptionText = item.description || "";
    const answerText = item.answer || "";

    if (isMongoAvailable()) {
      const query = await UserQuery.create({
        question: questionText,
        description: descriptionText,
        answer: answerText,
        status: "pending",
        source: "document_import",
        category: "General",
        tags: ["document-import"],
        userId,
        authorName
      });

      try {
        const db = getSQLiteDb();
        await db.run(
          `INSERT INTO user_queries (mongo_id, question, answer, status, source, description, category, tags, user_id, author_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          query._id.toString(),
          questionText,
          answerText,
          "pending",
          "document_import",
          descriptionText,
          "General",
          "document-import",
          userId,
          authorName
        );
      } catch (err) {
        console.error("SQLite user_queries document import sync failed:", err.message);
      }

      results.push({
        id: query._id.toString(),
        question: questionText,
        description: descriptionText,
        answer: answerText,
        status: "pending"
      });
    } else {
      const db = getSQLiteDb();
      const sqliteResult = await db.run(
        `INSERT INTO user_queries (question, answer, status, source, description, category, tags, user_id, author_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        questionText,
        answerText,
        "pending",
        "document_import",
        descriptionText,
        "General",
        "document-import",
        userId,
        authorName
      );

      results.push({
        id: sqliteResult.lastID.toString(),
        question: questionText,
        description: descriptionText,
        answer: answerText,
        status: "pending"
      });
    }
  }

  return results;
}

module.exports = {
  importContent,
  generateThreadFromDocument
};
