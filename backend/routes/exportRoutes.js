const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { exportAsJSON, exportAsCSV, exportAsMarkdown, exportAsPDF } = require("../services/exportService");
const { fail } = require("../utils/apiResponse");

const exportQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    format: z.enum(["json", "csv", "markdown", "pdf"]).default("json"),
    category: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    user: z.string().trim().optional(),
    startDate: z.string().trim().optional(),
    endDate: z.string().trim().optional()
  })
});

router.get("/", requireAuth, validate(exportQuerySchema), async (req, res) => {
  try {
    const { format } = req.query;

    if (format === "json") {
      const data = await exportAsJSON(req.query);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", 'attachment; filename="faqs.json"');
      return res.send(data);
    }

    if (format === "csv") {
      const data = await exportAsCSV(req.query);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="faqs.csv"');
      return res.send(data);
    }

    if (format === "markdown") {
      const data = await exportAsMarkdown(req.query);
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", 'attachment; filename="faqs.md"');
      return res.send(data);
    }

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="faqs.pdf"');
      await exportAsPDF(req.query, res);
      return;
    }

    return fail(res, { statusCode: 400, code: "INVALID_FORMAT", message: "Unsupported format" });
  } catch (error) {
    return fail(res, { statusCode: 500, code: "EXPORT_FAILED", message: error.message });
  }
});

module.exports = router;
