import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Lead from "../models/Lead.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getLeads = async (_req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json({ success: true, leads });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch leads" });
  }
};

export const uploadLeads = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const docs = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      sourceType: "file",
      filePath: file.path.replace(/\\/g, "/"),
      fileUrl: `/uploads/${file.filename}`,
      status: "ready"
    }));

    const leads = await Lead.insertMany(docs);
    res.status(201).json({ success: true, leads });
  } catch (error) {
    console.error("Upload leads error:", error);
    res.status(500).json({ success: false, message: "Unable to upload leads" });
  }
};

export const importLeadFromUrl = async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ success: false, message: "Import link is required" });
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(link)) {
      return res.status(400).json({ success: false, message: "Please provide a valid URL" });
    }

    const lead = await Lead.create({
      originalName: link,
      sourceType: "url",
      importUrl: link,
      status: "processing"
    });

    res.status(201).json({ success: true, lead });
  } catch (error) {
    console.error("Import lead error:", error);
    res.status(500).json({ success: false, message: "Unable to import lead from URL" });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    if (lead.sourceType === "file" && lead.filePath) {
      const filePath = path.isAbsolute(lead.filePath)
        ? lead.filePath
        : path.join(__dirname, "..", lead.filePath);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Unable to remove file:", err);
        }
      });
    }

    await lead.deleteOne();
    res.json({ success: true, message: "Lead removed" });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({ success: false, message: "Unable to delete lead" });
  }
};

export const addWebsiteLeads = async (req, res) => {
  try {
    const { websites } = req.body;
    if (!Array.isArray(websites) || websites.length === 0) {
      return res.status(400).json({ success: false, message: "No websites provided" });
    }

    const normalized = Array.from(
      new Set(
        websites
          .map((w) => (w || "").trim().toLowerCase())
          .filter((w) => w.length > 0)
      )
    );

    if (normalized.length === 0) {
      return res.status(400).json({ success: false, message: "No valid websites provided" });
    }

    const existing = await Lead.find({ website: { $in: normalized } }).select("website");
    const existingSet = new Set(existing.map((l) => l.website));
    const toInsert = normalized.filter((w) => !existingSet.has(w));

    if (toInsert.length > 0) {
      await Lead.insertMany(
        toInsert.map((site) => ({
          website: site,
          sourceType: "url",
          status: "processing"
        }))
      );
    }

    const leads = await Lead.find({ website: { $exists: true, $ne: null } }).sort({ createdAt: -1 });
    res.status(201).json({ success: true, leads, skipped: normalized.length - toInsert.length });
  } catch (error) {
    console.error("Add website leads error:", error);
    res.status(500).json({ success: false, message: "Unable to save websites" });
  }
};
