const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { isMongoAvailable } = require("../db/mongo");
const { getSQLiteDb } = require("../db/sqlite");

const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");
const { processDocument } = require("../services/documentService");
const authenticateAdmin = require("../middleware/adminAuth");

// Ensure upload folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage config
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storageConfig,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".docx", ".txt", ".md"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOCX, TXT, and Markdown are supported."));
    }
  }
});

// Apply admin authentication to all routes below
router.use(authenticateAdmin);

// Get all documents
router.get("/", async (req, res) => {
  try {
    if (isMongoAvailable()) {
      const docs = await Document.find().sort({ createdAt: -1 });
      return res.json({
        storage: "mongodb",
        data: docs.map(d => ({
          id: d._id.toString(),
          filename: d.filename,
          filepath: d.filepath,
          filetype: d.filetype,
          status: d.status,
          chunkCount: d.chunkCount,
          createdAt: d.createdAt
        }))
      });
    }

    const db = getSQLiteDb();
    const docs = await db.all("SELECT * FROM documents ORDER BY created_at DESC");
    res.json({
      storage: "sqlite",
      data: docs.map(d => ({
        id: d.id.toString(),
        filename: d.filename,
        filepath: d.filepath,
        filetype: d.filetype,
        status: d.status,
        chunkCount: d.chunk_count,
        createdAt: d.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to list documents", details: err.message });
  }
});

// Upload document
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const filename = req.file.originalname;
    const filepath = req.file.path;
    const filetype = path.extname(filename).toLowerCase().replace(".", "");

    let docId = null;

    if (isMongoAvailable()) {
      const doc = await Document.create({
        filename,
        filepath,
        filetype,
        status: "pending"
      });
      docId = doc._id.toString();

      // SQLite Fallback sync
      try {
        const db = getSQLiteDb();
        await db.run(
          "INSERT INTO documents (mongo_id, filename, filepath, filetype, status) VALUES (?, ?, ?, ?, 'pending')",
          docId, filename, filepath, filetype
        );
      } catch (e) {}
    } else {
      const db = getSQLiteDb();
      const result = await db.run(
        "INSERT INTO documents (filename, filepath, filetype, status) VALUES (?, ?, ?, 'pending')",
        filename, filepath, filetype
      );
      docId = result.lastID.toString();
    }

    // Trigger asynchronous file processing & chunking
    processDocument(docId)
      .then(() => console.log(`Finished processing document ID ${docId}`))
      .catch((err) => console.error(`Error processing document ID ${docId}:`, err));

    res.status(202).json({
      message: "Document upload accepted. Processing started.",
      documentId: docId
    });
  } catch (err) {
    res.status(500).json({ error: "Document upload failed", details: err.message });
  }
});

// Reprocess document
router.post("/:id/reprocess", async (req, res) => {
  try {
    const docId = req.params.id;

    if (isMongoAvailable()) {
      const doc = await Document.findById(docId);
      if (!doc) return res.status(404).json({ error: "Document not found." });
      doc.status = "pending";
      await doc.save();
    } else {
      const db = getSQLiteDb();
      await db.run("UPDATE documents SET status = 'pending' WHERE id = ?", docId);
    }

    processDocument(docId)
      .then(() => console.log(`Finished reprocessing document ID ${docId}`))
      .catch((err) => console.error(`Error reprocessing document ID ${docId}:`, err));

    res.json({ success: true, message: "Reprocessing triggered successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to trigger reprocess", details: err.message });
  }
});

// Download document
router.get("/:id/download", async (req, res) => {
  try {
    const docId = req.params.id;
    let docRecord = null;

    if (isMongoAvailable()) {
      docRecord = await Document.findById(docId);
    } else {
      const db = getSQLiteDb();
      docRecord = await db.get("SELECT * FROM documents WHERE id = ?", docId);
    }

    if (!docRecord) {
      return res.status(404).json({ error: "Document not found." });
    }

    const filepath = docRecord.filepath;
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "Physical file does not exist on disk." });
    }

    res.download(filepath, docRecord.filename);
  } catch (err) {
    res.status(500).json({ error: "Failed to download document", details: err.message });
  }
});

// Delete document
router.delete("/:id", async (req, res) => {
  try {
    const docId = req.params.id;
    let docRecord = null;

    if (isMongoAvailable()) {
      docRecord = await Document.findById(docId);
    } else {
      const db = getSQLiteDb();
      docRecord = await db.get("SELECT * FROM documents WHERE id = ?", docId);
    }

    if (!docRecord) {
      return res.status(404).json({ error: "Document not found." });
    }

    // Delete physical file
    try {
      if (fs.existsSync(docRecord.filepath)) {
        fs.unlinkSync(docRecord.filepath);
      }
    } catch (e) {
      console.warn(`Could not delete file on disk at: ${docRecord.filepath}`);
    }

    // Delete database records
    if (isMongoAvailable()) {
      await Document.findByIdAndDelete(docId);
      await DocumentChunk.deleteMany({ documentId: docId });

      try {
        const db = getSQLiteDb();
        await db.run("DELETE FROM documents WHERE mongo_id = ?", docId);
        await db.run("DELETE FROM document_chunks WHERE document_id = (SELECT id FROM documents WHERE mongo_id = ?)", docId);
      } catch (e) {}
    } else {
      const db = getSQLiteDb();
      await db.run("DELETE FROM documents WHERE id = ?", docId);
      await db.run("DELETE FROM document_chunks WHERE document_id = ?", docId);
    }

    res.json({ success: true, message: "Document and associated indexing chunks deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete document", details: err.message });
  }
});

module.exports = router;
