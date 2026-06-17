const fs = require("fs");
const path = require("path");
const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");

const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");

// Lazy load parsers to prevent crash if not installed
let pdfParse = null;
let mammoth = null;

try {
  pdfParse = require("pdf-parse");
} catch (e) {
  console.warn("pdf-parse not installed. PDF parsing will use fallback text extractor.");
}

try {
  mammoth = require("mammoth");
} catch (e) {
  console.warn("mammoth not installed. DOCX parsing will use fallback xml extractor.");
}

/**
 * Extract text from different file types
 */
async function extractText(filepath, filetype) {
  const ext = path.extname(filepath).toLowerCase();
  
  if (ext === ".txt" || ext === ".md") {
    return fs.readFileSync(filepath, "utf8");
  }
  
  if (ext === ".pdf") {
    if (pdfParse) {
      const dataBuffer = fs.readFileSync(filepath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else {
      // Zero-dependency basic PDF text stream extractor
      const buffer = fs.readFileSync(filepath);
      const pdfString = buffer.toString("binary");
      const btMatches = pdfString.match(/BT[\s\S]*?ET/g) || [];
      let text = "";
      for (const block of btMatches) {
        // Find text content inside parenthesis
        const contentMatches = block.match(/\((.*?)\)/g) || [];
        for (const match of contentMatches) {
          text += match.slice(1, -1) + " ";
        }
        text += "\n";
      }
      return text || "PDF Fallback: Text extraction limited. Please install pdf-parse.";
    }
  }
  
  if (ext === ".docx") {
    if (mammoth) {
      const result = await mammoth.extractRawText({ path: filepath });
      return result.value;
    } else {
      return "DOCX Fallback: Text extraction limited. Please install mammoth.";
    }
  }
  
  throw new Error(`Unsupported file type: ${filetype}`);
}

/**
 * Split text into chunks with overlap
 */
function chunkText(text, chunkSize = 800, overlap = 200) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const chunks = [];
  
  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    if (chunkWords.length === 0) break;
    chunks.push(chunkWords.join(" "));
    i += (chunkSize - overlap);
  }
  
  return chunks;
}

/**
 * Parse, chunk, and index a document
 */
async function processDocument(docId) {
  let docRecord = null;
  let useMongo = isMongoAvailable();
  
  if (useMongo) {
    docRecord = await Document.findById(docId);
  } else {
    const db = getSQLiteDb();
    docRecord = await db.get("SELECT * FROM documents WHERE id = ?", docId);
  }
  
  if (!docRecord) {
    throw new Error("Document not found for processing");
  }
  
  const idStr = useMongo ? docRecord._id.toString() : docRecord.id.toString();
  const filepath = useMongo ? docRecord.filepath : docRecord.filepath;
  const filetype = useMongo ? docRecord.filetype : docRecord.filetype;
  
  try {
    // 1. Extract text
    const text = await extractText(filepath, filetype);
    
    // 2. Chunk text
    const chunks = chunkText(text);
    
    // 3. Save chunks to database
    if (useMongo) {
      // Clear existing chunks if reprocessing
      await DocumentChunk.deleteMany({ documentId: idStr });
      
      const chunkDocs = chunks.map((content, idx) => ({
        documentId: idStr,
        content,
        chunkIndex: idx
      }));
      await DocumentChunk.insertMany(chunkDocs);
      
      docRecord.status = "processed";
      docRecord.chunkCount = chunks.length;
      await docRecord.save();
    } else {
      const db = getSQLiteDb();
      await db.run("DELETE FROM document_chunks WHERE document_id = ?", idStr);
      
      for (let idx = 0; idx < chunks.length; idx++) {
        await db.run(
          "INSERT INTO document_chunks (document_id, content, chunk_index) VALUES (?, ?, ?)",
          idStr, chunks[idx], idx
        );
      }
      
      await db.run(
        "UPDATE documents SET status = 'processed', chunk_count = ? WHERE id = ?",
        chunks.length, idStr
      );
    }
    
    console.log(`Successfully indexed document: ${docRecord.filename || idStr} into ${chunks.length} chunks.`);
    return true;
  } catch (err) {
    console.error(`Failed to process document ${idStr}:`, err);
    if (useMongo) {
      docRecord.status = "failed";
      await docRecord.save();
    } else {
      const db = getSQLiteDb();
      await db.run("UPDATE documents SET status = 'failed' WHERE id = ?", idStr);
    }
    throw err;
  }
}

/**
 * Tokenize a text snippet (remove stopwords, lowercase, split)
 */
function tokenize(text) {
  const stopWords = new Set(["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

/**
 * TF-IDF Cosine Similarity Ranker (RAG Search Engine)
 */
async function retrieveRelevantChunks(query, limit = 4) {
  try {
    let allChunks = [];
    
    // 1. Fetch chunks
    if (isMongoAvailable()) {
      allChunks = await DocumentChunk.find().populate("documentId");
      allChunks = allChunks.map(c => ({
        id: c._id.toString(),
        content: c.content,
        filename: c.documentId ? c.documentId.filename : "document"
      }));
    } else {
      const db = getSQLiteDb();
      const rows = await db.all(`
        SELECT dc.*, d.filename 
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
      `);
      allChunks = rows.map(r => ({
        id: r.id.toString(),
        content: r.content,
        filename: r.filename
      }));
    }
    
    if (allChunks.length === 0) return [];
    
    // 2. Compute TF-IDF
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];
    
    const chunkTokensList = allChunks.map(c => tokenize(c.content));
    
    // Count document frequencies (DF)
    const df = {};
    for (const tokens of chunkTokensList) {
      const uniqueTokens = new Set(tokens);
      for (const t of uniqueTokens) {
        df[t] = (df[t] || 0) + 1;
      }
    }
    
    // Calculate IDF
    const idf = {};
    const N = allChunks.length;
    for (const t in df) {
      idf[t] = Math.log(1 + N / df[t]);
    }
    
    // Calculate Term Frequencies (TF) and Chunks weights
    const similarities = [];
    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      const tokens = chunkTokensList[i];
      if (tokens.length === 0) continue;
      
      const tf = {};
      for (const t of tokens) {
        tf[t] = (tf[t] || 0) + 1;
      }
      
      // Calculate dot product and vectors norms
      let dotProduct = 0;
      let queryNorm = 0;
      let chunkNorm = 0;
      
      const uniqueQueryTokens = new Set(queryTokens);
      
      // Get vocabulary of query + chunk
      const vocab = new Set([...queryTokens, ...tokens]);
      
      for (const word of vocab) {
        const wordIdf = idf[word] || 0.1;
        
        // Query weight
        const qCount = queryTokens.filter(t => t === word).length;
        const qWeight = qCount * wordIdf;
        
        // Chunk weight
        const cCount = tf[word] || 0;
        const cWeight = cCount * wordIdf;
        
        dotProduct += qWeight * cWeight;
        queryNorm += qWeight * qWeight;
        chunkNorm += cWeight * cWeight;
      }
      
      const score = (queryNorm > 0 && chunkNorm > 0) 
        ? dotProduct / (Math.sqrt(queryNorm) * Math.sqrt(chunkNorm))
        : 0;
      
      if (score > 0) {
        similarities.push({
          chunk,
          score
        });
      }
    }
    
    // Sort and limit
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, limit).map(item => ({
      content: item.chunk.content,
      filename: item.chunk.filename,
      score: item.score
    }));
  } catch (err) {
    console.error("Failed to retrieve relevant chunks:", err);
    return [];
  }
}

module.exports = {
  processDocument,
  retrieveRelevantChunks
};
