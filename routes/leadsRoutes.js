import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  uploadLeads,
  importLeadFromUrl,
  getLeads,
  deleteLead,
  addWebsiteLeads,
  addBulkLeads,
  updateLeadStatus
} from "../controllers/leadsController.js";
import authenticateJWT from "../middleware/authMiddleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const allowedMimeTypes = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf"
];

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  }
});

router.get("/", authenticateJWT, getLeads);
router.post("/upload", authenticateJWT, upload.array("files", 10), uploadLeads);
router.post("/import", authenticateJWT, importLeadFromUrl);
router.post("/websites", authenticateJWT, addWebsiteLeads);
router.post("/bulk", authenticateJWT, addBulkLeads);
router.patch("/:id/status", authenticateJWT, updateLeadStatus);
router.delete("/:id", authenticateJWT, deleteLead);

export default router;
